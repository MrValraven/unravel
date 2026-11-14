import type { Page } from "@playwright/test";

const STORAGE_KEY_PREFIX = "unravel:v2:";
const SEED_MARKER_KEY_PREFIX = "e2e:seeded:";
/** Counts seedStorage calls, so each call gets its own marker and runs once. */
let seedCallCount = 0;

/** A version far ahead of the app, so the "What's new" dialog never opens. */
const FUTURE_VERSION = "99.0.0";

export const returningPlayerSettings = {
  locale: "en",
  textScale: 1,
  isDimMode: false,
  isHapticsEnabled: true,
  hasSeenIntro: true,
  lastSeenVersion: FUTURE_VERSION,
};

export interface SeedOptions {
  /** Merged over the returning-player settings. */
  settings?: Partial<typeof returningPlayerSettings>;
  /** Short storage names (without the `unravel:v2:` prefix) mapped to their JSON values. */
  extra?: Record<string, unknown>;
}

/**
 * Fills localStorage before the app starts, once per call in a browser context. Each call
 * has its own marker key, so a second call still seeds on the next navigation, while a later
 * reload or a second page keeps what the test changed in between.
 */
export const seedStorage = async (
  page: Page,
  options: SeedOptions = {}
): Promise<void> => {
  const entries: Record<string, string> = {
    [`${STORAGE_KEY_PREFIX}settings`]: JSON.stringify({
      ...returningPlayerSettings,
      ...options.settings,
    }),
  };
  for (const [name, value] of Object.entries(options.extra ?? {})) {
    entries[`${STORAGE_KEY_PREFIX}${name}`] = JSON.stringify(value);
  }
  seedCallCount += 1;
  const markerKey = `${SEED_MARKER_KEY_PREFIX}${seedCallCount}`;
  await page.addInitScript(
    ({ entries: seedEntries, markerKey }) => {
      try {
        if (window.localStorage.getItem(markerKey)) return;
        for (const [key, value] of Object.entries(seedEntries)) {
          window.localStorage.setItem(key, value);
        }
        window.localStorage.setItem(markerKey, "yes");
      } catch {
        // Storage is blocked: the app falls back to its defaults.
      }
    },
    { entries, markerKey }
  );
};

export const buildSavedProgress = (
  deckId: string,
  order: string[],
  position: number
) => ({
  deckId,
  order,
  position,
  hiddenCardIds: [] as string[],
  turnIndex: 0,
  options: {
    isShuffled: false,
    startLevel: 1,
    isTableMode: false,
    players: [] as string[],
  },
  startedAt: Date.now() - 60_000,
  updatedAt: Date.now(),
});

/** Reads one raw value from the app's localStorage namespace. */
export const readStoredText = (
  page: Page,
  name: string
): Promise<string | null> =>
  page.evaluate(
    (storageKey) => window.localStorage.getItem(storageKey),
    `${STORAGE_KEY_PREFIX}${name}`
  );

/**
 * Replaces the clipboard and the native share sheet with recorders, so share links can be
 * read back the same way in every browser. Links land in `window.copiedLinks`.
 */
export const recordSharedLinks = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const copiedLinks: string[] = [];
    Object.defineProperty(window, "copiedLinks", {
      value: copiedLinks,
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: (text: string) => {
          copiedLinks.push(text);
          return Promise.resolve();
        },
      },
      configurable: true,
    });
  });
};

export const readCopiedLinks = (page: Page): Promise<string[]> =>
  page.evaluate(
    () => (window as unknown as { copiedLinks: string[] }).copiedLinks
  );

/** Five ids at the start of the Unravel deck. */
export const unravelCardIds = ["001", "002", "003", "004", "005"].map(
  (suffix) => `unravel-${suffix}`
);
