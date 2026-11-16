/**
 * Unravel's service worker, built by vite-plugin-pwa's injectManifest strategy.
 *
 * It does what the generated worker did before (precache the app, serve the app
 * shell for navigations, drop old precaches, and wait for the "Update now" button
 * in src/components/UpdateBanner.tsx), plus the daily card reminder: on Chromium
 * installs, Periodic Background Sync wakes it about once a day and it shows
 * today's card as a notification.
 */
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import {
  DAILY_CARD_CACHE_NAME,
  DAILY_CARD_LAST_SHOWN_KEY,
  DAILY_CARD_SCHEDULE_KEY,
  DAILY_CARD_SYNC_TAG,
  DAILY_CARD_URL,
  OPEN_URL_MESSAGE_TYPE,
  getDailyCardNotificationContent,
  isDailyCardSchedule,
  toDateKey,
} from "./storage/dailyCardSchedule";

// The app's TypeScript program uses the DOM library, so the few worker types used here
// are spelled out instead of pulling the WebWorker library into every file.
interface ExtendableEventLike extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface ExtendableMessageEventLike extends ExtendableEventLike {
  readonly data: unknown;
}

interface PeriodicSyncEventLike extends ExtendableEventLike {
  readonly tag: string;
}

interface NotificationEventLike extends ExtendableEventLike {
  readonly notification: Notification;
}

interface WindowClientLike {
  readonly url: string;
  readonly visibilityState: DocumentVisibilityState;
  focus(): Promise<WindowClientLike>;
  postMessage(message: unknown): void;
}

interface ClientsLike {
  matchAll(options: {
    type: "window";
    includeUncontrolled: boolean;
  }): Promise<readonly WindowClientLike[]>;
  openWindow(url: string): Promise<WindowClientLike | null>;
}

interface ServiceWorkerScopeLike {
  /** Replaced at build time with the precache list. */
  readonly __WB_MANIFEST: Array<PrecacheEntry | string>;
  readonly registration: ServiceWorkerRegistration;
  readonly clients: ClientsLike;
  readonly location: { readonly origin: string };
  skipWaiting(): Promise<void>;
  addEventListener(
    type: "message",
    listener: (event: ExtendableMessageEventLike) => void
  ): void;
  addEventListener(
    type: "periodicsync",
    listener: (event: PeriodicSyncEventLike) => void
  ): void;
  addEventListener(
    type: "notificationclick",
    listener: (event: NotificationEventLike) => void
  ): void;
}

declare const self: ServiceWorkerScopeLike;

// ---- Prompt-mode updates ----
// workbox-window's messageSkipWaiting() (UpdateBanner's "Update now") sends this.
self.addEventListener("message", (event) => {
  const data = event.data as { type?: unknown } | null;
  if (data && data.type === "SKIP_WAITING") void self.skipWaiting();
});

// ---- Precache and app shell ----
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// Every in-app path gets the app shell. These files load from the network
// instead: crawler files, link preview images, and images only the operating
// system reads (install screenshots, iOS launch screens, shortcut icons).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [
      /^\/(sitemap\.xml|robots\.txt|og\/|screenshots\/|splash\/|shortcuts\/)/,
    ],
  })
);

// ---- Daily card reminder ----
const readText = async (
  cache: Cache,
  key: string
): Promise<string | undefined> => {
  const response = await cache.match(key);
  return response ? response.text() : undefined;
};

const showDailyCardNotification = async (): Promise<void> => {
  const cache = await caches.open(DAILY_CARD_CACHE_NAME);
  const scheduleText = await readText(cache, DAILY_CARD_SCHEDULE_KEY);
  // The page writes the schedule when the reminder is turned on; without it there is nothing to say.
  if (scheduleText === undefined) return;
  let schedule: unknown;
  try {
    schedule = JSON.parse(scheduleText);
  } catch {
    return;
  }
  if (!isDailyCardSchedule(schedule)) return;

  const today = new Date();
  const todayKey = toDateKey(today);
  // Periodic sync can fire more than once a day; one reminder per day is enough.
  if ((await readText(cache, DAILY_CARD_LAST_SHOWN_KEY)) === todayKey) return;

  // A player looking at Unravel right now does not need a notification about it.
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  if (windows.some((client) => client.visibilityState === "visible")) return;

  const { title, body, lang } = getDailyCardNotificationContent(
    schedule,
    today
  );
  await self.registration.showNotification(title, {
    body,
    lang,
    tag: DAILY_CARD_SYNC_TAG,
    icon: "/pwa-192x192.png",
    data: { url: DAILY_CARD_URL },
  });
  await cache.put(DAILY_CARD_LAST_SHOWN_KEY, new Response(todayKey));
};

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== DAILY_CARD_SYNC_TAG) return;
  // A revoked notification permission makes showNotification reject; the next sync tries again.
  event.waitUntil(showDailyCardNotification().catch(() => undefined));
});

const openDailyCard = async (path: string): Promise<void> => {
  const targetUrl = new URL(path, self.location.origin).href;
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  const openWindow = windows.find(
    (client) => new URL(client.url).origin === self.location.origin
  );
  if (!openWindow) {
    await self.clients.openWindow(targetUrl);
    return;
  }
  // The open app routes there itself (src/main.tsx), so a game or an unsaved
  // custom deck in that window is not reloaded away.
  await openWindow.focus();
  openWindow.postMessage({ type: OPEN_URL_MESSAGE_TYPE, url: path });
};

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data as { url?: unknown } | null;
  const path =
    data && typeof data.url === "string" && data.url.startsWith("/")
      ? data.url
      : DAILY_CARD_URL;
  event.waitUntil(openDailyCard(path));
});
