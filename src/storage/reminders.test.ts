import { getDailyCard } from "../content/dailyCard";
import { localize } from "../i18n/localize";
import {
  DAILY_CARD_SCHEDULE_KEY,
  DAILY_CARD_SYNC_TAG,
  getDailyCardNotificationContent,
  isDailyCardSchedule,
  toDateKey,
} from "./dailyCardSchedule";
import {
  SCHEDULE_DAY_COUNT,
  buildDailyCardSchedule,
  disableDailyCardReminder,
  enableDailyCardReminder,
  remindersStore,
} from "./reminders";

const STORAGE_KEY = "unravel:v2:reminders";

describe("buildDailyCardSchedule", () => {
  it("lists the card of the day for each coming day, as the home page shows it", () => {
    // Spans the end of March, where Europe moves its clocks forward.
    const start = new Date(2026, 2, 20, 23, 30);
    for (const locale of ["en", "pt"] as const) {
      const schedule = buildDailyCardSchedule(locale, start);
      expect(schedule.days).toHaveLength(SCHEDULE_DAY_COUNT);
      expect(isDailyCardSchedule(schedule)).toBe(true);
      schedule.days.forEach((day, dayOffset) => {
        const date = new Date(2026, 2, 20 + dayOffset, 12);
        const { card, deck } = getDailyCard(date);
        expect(day.date).toBe(toDateKey(date));
        expect(day.text).toBe(localize(card.text, locale));
        expect(day.deckTitle).toBe(localize(deck.title, locale));
      });
    }
  });

  it("writes the notification in the player's language", () => {
    expect(buildDailyCardSchedule("en").title).toBe("Card of the day");
    const portuguese = buildDailyCardSchedule("pt");
    expect(portuguese.title).toBe("Carta do dia");
    expect(portuguese.lang).toBe("pt-PT");
  });
});

describe("getDailyCardNotificationContent", () => {
  it("uses today's card, then the fallback line once the schedule runs out", () => {
    const start = new Date(2026, 10, 16, 9);
    const schedule = buildDailyCardSchedule("en", start, 2);
    expect(getDailyCardNotificationContent(schedule, start).body).toBe(
      schedule.days[0]?.text
    );
    const later = new Date(2026, 10, 30, 9);
    expect(getDailyCardNotificationContent(schedule, later).body).toBe(
      schedule.fallbackBody
    );
  });
});

describe("remindersStore", () => {
  afterEach(() => window.localStorage.clear());

  it("starts off and ignores stored values of the wrong shape", () => {
    expect(remindersStore.get()).toEqual({ isDailyCardOn: false });
    window.localStorage.setItem(STORAGE_KEY, '{"isDailyCardOn":"yes"}');
    expect(remindersStore.get()).toEqual({ isDailyCardOn: false });
  });
});

interface BrowserStubs {
  notificationPermission?: NotificationPermission;
  requestedPermission?: NotificationPermission;
  backgroundSyncState?: PermissionState;
  isStandalone?: boolean;
  hasActiveWorker?: boolean;
  registerError?: Error;
}

const stubBrowser = ({
  notificationPermission = "granted",
  requestedPermission = "granted",
  backgroundSyncState = "granted",
  isStandalone = true,
  hasActiveWorker = true,
  registerError,
}: BrowserStubs = {}) => {
  const periodicSync = {
    register: vi.fn(() =>
      registerError ? Promise.reject(registerError) : Promise.resolve()
    ),
    unregister: vi.fn(() => Promise.resolve()),
    getTags: vi.fn(() => Promise.resolve([DAILY_CARD_SYNC_TAG])),
  };
  const cache = { put: vi.fn(() => Promise.resolve()) };
  vi.stubGlobal(
    "ServiceWorkerRegistration",
    // Chromium defines periodicSync as a prototype getter, which the support check looks for.
    class {
      get periodicSync() {
        return periodicSync;
      }
    }
  );
  vi.stubGlobal(
    "Notification",
    Object.assign(function Notification() {}, {
      permission: notificationPermission,
      requestPermission: vi.fn(() => Promise.resolve(requestedPermission)),
    })
  );
  vi.stubGlobal("caches", {
    open: vi.fn(() => Promise.resolve(cache)),
    delete: vi.fn(() => Promise.resolve(true)),
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: isStandalone && query.includes("standalone"),
    }))
  );
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn(() =>
        Promise.resolve(
          hasActiveWorker ? { active: {}, periodicSync } : undefined
        )
      ),
    },
  });
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: {
      query: vi.fn(() => Promise.resolve({ state: backgroundSyncState })),
    },
  });
  return { periodicSync, cache };
};

describe("enableDailyCardReminder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "serviceWorker");
    Reflect.deleteProperty(navigator, "permissions");
    window.localStorage.clear();
  });

  it("names the browser as the cause where background sync does not exist", async () => {
    await expect(enableDailyCardReminder("en")).resolves.toEqual({
      isOk: false,
      cause: "unsupported",
      reason: undefined,
    });
  });

  it("registers the daily sync, saves the schedule and turns the switch on", async () => {
    const { periodicSync, cache } = stubBrowser();
    await expect(enableDailyCardReminder("en")).resolves.toEqual({
      isOk: true,
    });
    expect(periodicSync.register).toHaveBeenCalledWith(DAILY_CARD_SYNC_TAG, {
      minInterval: 24 * 60 * 60 * 1000,
    });
    expect(cache.put).toHaveBeenCalledWith(
      DAILY_CARD_SCHEDULE_KEY,
      expect.any(Response)
    );
    expect(remindersStore.get().isDailyCardOn).toBe(true);
  });

  it.each([
    [{ notificationPermission: "denied" }, "notificationsDenied"],
    [
      { notificationPermission: "default", requestedPermission: "default" },
      "notificationsDismissed",
    ],
    [{ backgroundSyncState: "denied", isStandalone: false }, "notInstalled"],
    [
      { backgroundSyncState: "denied", isStandalone: true },
      "backgroundSyncBlocked",
    ],
    [{ hasActiveWorker: false }, "noServiceWorker"],
    [
      {
        registerError: new DOMException(
          "Permission denied.",
          "NotAllowedError"
        ),
        isStandalone: false,
      },
      "notInstalled",
    ],
  ] satisfies [BrowserStubs, string][])(
    "reports %o as %s and leaves the switch off",
    async (stubs, cause) => {
      stubBrowser(stubs);
      const result = await enableDailyCardReminder("en");
      expect(result).toMatchObject({ isOk: false, cause });
      expect(remindersStore.get().isDailyCardOn).toBe(false);
    }
  );

  it("passes the browser's own reason through when it refuses for another cause", async () => {
    stubBrowser({ registerError: new Error("Quota exceeded") });
    await expect(enableDailyCardReminder("en")).resolves.toEqual({
      isOk: false,
      cause: "syncRefused",
      reason: "Error: Quota exceeded",
    });
  });

  it("turns off by unregistering the sync and dropping the schedule", async () => {
    const { periodicSync } = stubBrowser();
    remindersStore.set({ isDailyCardOn: true });
    await expect(disableDailyCardReminder()).resolves.toEqual({ isOk: true });
    expect(periodicSync.unregister).toHaveBeenCalledWith(DAILY_CARD_SYNC_TAG);
    expect(caches.delete).toHaveBeenCalled();
    expect(remindersStore.get().isDailyCardOn).toBe(false);
  });
});
