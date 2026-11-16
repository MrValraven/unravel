/**
 * The contract between the page and the service worker for the daily card reminder.
 *
 * The page knows every deck and computes the card of the day; the service worker
 * stays small and knows none of them. So while Unravel is open, the page writes the
 * cards for the coming days into Cache Storage, and the worker's daily
 * `periodicsync` reads today's entry from there. This file has no React and no
 * deck imports, because src/sw.ts bundles it.
 */

/** Periodic Background Sync tag the page registers and src/sw.ts listens for. */
export const DAILY_CARD_SYNC_TAG = "daily-card";

/** Cache Storage bucket for the schedule. Not a workbox precache, so updates never remove it. */
export const DAILY_CARD_CACHE_NAME = "unravel-daily-card";

/** Cache key of the schedule JSON. Never requested over the network. */
export const DAILY_CARD_SCHEDULE_KEY = "/__unravel/daily-card-schedule.json";

/** Cache key of the "YYYY-MM-DD" of the last reminder shown, so a day gets one at most. */
export const DAILY_CARD_LAST_SHOWN_KEY = "/__unravel/daily-card-last-shown.txt";

/** Where a reminder opens: home, scrolled to the card of the day. */
export const DAILY_CARD_URL = "/#today";

/** Message the worker posts to an open Unravel window instead of reloading it. */
export const OPEN_URL_MESSAGE_TYPE = "UNRAVEL_OPEN_URL";

export interface DailyCardScheduleDay {
  /** Local calendar day, "YYYY-MM-DD". */
  date: string;
  /** Card text in the player's language. */
  text: string;
  deckTitle: string;
}

export interface DailyCardSchedule {
  /** BCP 47 language of the texts, for the notification. */
  lang: string;
  /** Notification title, such as "Card of the day". */
  title: string;
  /** Body used when the schedule has run out because Unravel was not opened for weeks. */
  fallbackBody: string;
  days: DailyCardScheduleDay[];
}

const padTwoDigits = (value: number): string => String(value).padStart(2, "0");

/** Local calendar day as "YYYY-MM-DD", the same key src/content/dailyCard.ts hashes. */
export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;

const isScheduleDay = (raw: unknown): raw is DailyCardScheduleDay => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.date === "string" &&
    typeof candidate.text === "string" &&
    typeof candidate.deckTitle === "string"
  );
};

export const isDailyCardSchedule = (raw: unknown): raw is DailyCardSchedule => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.lang === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.fallbackBody === "string" &&
    Array.isArray(candidate.days) &&
    candidate.days.every(isScheduleDay)
  );
};

export interface DailyCardNotificationContent {
  title: string;
  body: string;
  lang: string;
}

/** Today's notification: the scheduled card, or the fallback line once the schedule ran out. */
export const getDailyCardNotificationContent = (
  schedule: DailyCardSchedule,
  today: Date
): DailyCardNotificationContent => {
  const todayKey = toDateKey(today);
  const day = schedule.days.find((entry) => entry.date === todayKey);
  return {
    title: schedule.title,
    body: day ? day.text : schedule.fallbackBody,
    lang: schedule.lang,
  };
};
