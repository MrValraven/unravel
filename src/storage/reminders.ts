import { sharedCopy } from "../components/copy";
import { getDailyCard } from "../content/dailyCard";
import type { Locale } from "../content/types";
import { localize } from "../i18n/localize";
import { createStore, useStore } from "./createStore";
import {
  DAILY_CARD_CACHE_NAME,
  DAILY_CARD_SCHEDULE_KEY,
  DAILY_CARD_SYNC_TAG,
  toDateKey,
  type DailyCardSchedule,
} from "./dailyCardSchedule";

export interface ReminderSettings {
  /** The player turned the daily card reminder on and the browser accepted it. */
  isDailyCardOn: boolean;
}

export const defaultReminderSettings: ReminderSettings = {
  isDailyCardOn: false,
};

const isReminderSettings = (raw: unknown): raw is ReminderSettings => {
  if (typeof raw !== "object" || raw === null) return false;
  return typeof (raw as Record<string, unknown>).isDailyCardOn === "boolean";
};

export const remindersStore = createStore<ReminderSettings>(
  "reminders",
  defaultReminderSettings,
  isReminderSettings
);

export const useReminders = (): ReminderSettings => useStore(remindersStore);

/** Days of cards written ahead, so the reminder keeps today's card for weeks without Unravel being opened. */
export const SCHEDULE_DAY_COUNT = 45;

/** Periodic Background Sync asks for at most one wake-up a day; the browser may space them further. */
export const DAILY_SYNC_MIN_INTERVAL_MILLISECONDS = 24 * 60 * 60 * 1000;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** The card of the day for each of the next `dayCount` local days, in the player's language. */
export const buildDailyCardSchedule = (
  locale: Locale,
  today: Date = new Date(),
  dayCount: number = SCHEDULE_DAY_COUNT
): DailyCardSchedule => {
  const copy = sharedCopy[locale].dailyReminder;
  // Noon keeps the arithmetic clear of daylight saving jumps at midnight.
  const startNoon = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12
  );
  const days = Array.from({ length: dayCount }, (_, dayOffset) => {
    const day = new Date(
      startNoon.getTime() + dayOffset * MILLISECONDS_PER_DAY
    );
    const { card, deck } = getDailyCard(day);
    return {
      date: toDateKey(day),
      text: localize(card.text, locale),
      deckTitle: localize(deck.title, locale),
    };
  });
  return {
    lang: locale === "pt" ? "pt-PT" : "en",
    title: copy.notificationTitle,
    fallbackBody: copy.notificationFallback,
    days,
  };
};

/** Writes the schedule where src/sw.ts reads it. False when Cache Storage is missing or blocked. */
export const saveDailyCardSchedule = async (
  locale: Locale,
  today: Date = new Date()
): Promise<boolean> => {
  try {
    if (typeof caches === "undefined") return false;
    const cache = await caches.open(DAILY_CARD_CACHE_NAME);
    await cache.put(
      DAILY_CARD_SCHEDULE_KEY,
      new Response(JSON.stringify(buildDailyCardSchedule(locale, today)), {
        headers: { "Content-Type": "application/json" },
      })
    );
    return true;
  } catch {
    return false;
  }
};

const deleteDailyCardSchedule = async (): Promise<void> => {
  try {
    if (typeof caches === "undefined") return;
    await caches.delete(DAILY_CARD_CACHE_NAME);
  } catch {
    // Blocked storage keeps nothing to delete.
  }
};

// ---- Browser support ----

/** The Periodic Background Sync manager, which the DOM typings do not include yet. */
interface PeriodicSyncManagerLike {
  register(tag: string, options?: { minInterval?: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

const getPeriodicSync = (
  registration: ServiceWorkerRegistration
): PeriodicSyncManagerLike | undefined =>
  (
    registration as ServiceWorkerRegistration & {
      periodicSync?: PeriodicSyncManagerLike;
    }
  ).periodicSync;

/** Chromium only, today: notifications plus Periodic Background Sync in a service worker. */
export const isDailyReminderSupported = (): boolean =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "Notification" in window &&
  typeof ServiceWorkerRegistration !== "undefined" &&
  "periodicSync" in ServiceWorkerRegistration.prototype;

/** True when Unravel runs as an installed app, the only place Chromium grants background sync. */
export const isRunningInstalled = (): boolean => {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches
    );
  } catch {
    return false;
  }
};

/** The "periodic-background-sync" permission, or undefined when the browser cannot say. */
export const queryBackgroundSyncPermission = async (): Promise<
  PermissionState | undefined
> => {
  try {
    const status = await navigator.permissions.query({
      name: "periodic-background-sync" as PermissionName,
    });
    return status.state;
  } catch {
    return undefined;
  }
};

const getActiveRegistration = async (): Promise<
  ServiceWorkerRegistration | undefined
> => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active ? registration : undefined;
  } catch {
    return undefined;
  }
};

interface NamedError {
  name: string;
  message?: unknown;
}

/** Error and DOMException alike; DOMException is not an Error subclass everywhere. */
const isNamedError = (error: unknown): error is NamedError =>
  typeof error === "object" &&
  error !== null &&
  typeof (error as { name?: unknown }).name === "string";

const describeError = (error: unknown): string => {
  if (!isNamedError(error)) return String(error);
  return typeof error.message === "string" && error.message
    ? `${error.name}: ${error.message}`
    : error.name;
};

export type ReminderFailureCause =
  | "unsupported"
  | "notificationsDenied"
  | "notificationsDismissed"
  | "notInstalled"
  | "backgroundSyncBlocked"
  | "noServiceWorker"
  | "syncRefused"
  | "scheduleNotSaved"
  | "turnOffFailed";

export type ReminderResult =
  | { isOk: true }
  | { isOk: false; cause: ReminderFailureCause; reason?: string };

const fail = (
  cause: ReminderFailureCause,
  reason?: string
): ReminderResult => ({ isOk: false, cause, reason });

/** Background sync was refused: not installed, or installed with background sync blocked. */
const backgroundSyncRefusal = (): ReminderResult =>
  fail(isRunningInstalled() ? "backgroundSyncBlocked" : "notInstalled");

/**
 * Asks for notifications, checks background sync, registers the daily sync and
 * writes the schedule. Each refusal comes back with its own cause.
 */
export const enableDailyCardReminder = async (
  locale: Locale
): Promise<ReminderResult> => {
  if (!isDailyReminderSupported()) return fail("unsupported");

  let permission: NotificationPermission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      return fail("syncRefused", describeError(error));
    }
  }
  if (permission === "denied") return fail("notificationsDenied");
  if (permission !== "granted") return fail("notificationsDismissed");

  // There is no prompt for this permission: Chromium grants it to installed apps.
  if ((await queryBackgroundSyncPermission()) === "denied") {
    return backgroundSyncRefusal();
  }

  const registration = await getActiveRegistration();
  const periodicSync = registration && getPeriodicSync(registration);
  if (!periodicSync) return fail("noServiceWorker");

  try {
    await periodicSync.register(DAILY_CARD_SYNC_TAG, {
      minInterval: DAILY_SYNC_MIN_INTERVAL_MILLISECONDS,
    });
  } catch (error) {
    if (isNamedError(error) && error.name === "NotAllowedError") {
      return backgroundSyncRefusal();
    }
    return fail("syncRefused", describeError(error));
  }

  // Without a schedule the worker stays quiet, so the reminder is not on until it is written.
  if (!(await saveDailyCardSchedule(locale))) {
    await periodicSync.unregister(DAILY_CARD_SYNC_TAG).catch(() => undefined);
    return fail("scheduleNotSaved");
  }
  remindersStore.set({ isDailyCardOn: true });
  return { isOk: true };
};

/** Cancels the daily sync and forgets the schedule. */
export const disableDailyCardReminder = async (): Promise<ReminderResult> => {
  const registration = await getActiveRegistration();
  const periodicSync = registration && getPeriodicSync(registration);
  if (periodicSync) {
    try {
      await periodicSync.unregister(DAILY_CARD_SYNC_TAG);
    } catch (error) {
      return fail("turnOffFailed", describeError(error));
    }
  }
  await deleteDailyCardSchedule();
  remindersStore.set({ isDailyCardOn: false });
  return { isOk: true };
};

/** Whether the browser still has the daily sync registered, or undefined when it cannot tell. */
export const isDailyCardSyncRegistered = async (): Promise<
  boolean | undefined
> => {
  if (!isDailyReminderSupported()) return undefined;
  const registration = await getActiveRegistration();
  const periodicSync = registration && getPeriodicSync(registration);
  if (!periodicSync) return undefined;
  try {
    return (await periodicSync.getTags()).includes(DAILY_CARD_SYNC_TAG);
  } catch {
    return undefined;
  }
};

/**
 * While the reminder is on, rewrites the schedule from today in the current language.
 * main.tsx calls it on start and on a language change, so the weeks ahead stay filled.
 */
export const refreshDailyCardSchedule = async (
  locale: Locale
): Promise<void> => {
  if (!remindersStore.get().isDailyCardOn) return;
  await saveDailyCardSchedule(locale);
};
