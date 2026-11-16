import type { Deck, IntensityLevel } from "../content/types";
import { confirmAge } from "./ageGate";
import { createStore, useStore } from "./createStore";
import { settingsStore } from "./settings";

export const MAX_PLAYERS = 10;

export interface PlayOptions {
  isShuffled: boolean;
  startLevel: IntensityLevel;
  isTableMode: boolean;
  /** 0 to 10 names. */
  players: string[];
}

export interface SavedProgress {
  deckId: string;
  /** Card ids in play order. */
  order: string[];
  /** Index into `order` of the current card. */
  position: number;
  hiddenCardIds: string[];
  turnIndex: number;
  /**
   * 0 or 1: which of two named players answers first on the first card.
   * Optional because games saved before it existed have none; they start with player 1.
   */
  firstStarterIndex?: number;
  options: PlayOptions;
  /** Epoch milliseconds. */
  startedAt: number;
  updatedAt: number;
}

const isStringList = (raw: unknown): raw is string[] =>
  Array.isArray(raw) && raw.every((item) => typeof item === "string");

const isNonNegativeInteger = (raw: unknown): raw is number =>
  typeof raw === "number" && Number.isInteger(raw) && raw >= 0;

/** Shared by every store that keeps play options: the saved game and the last-used options. */
export const isPlayOptions = (raw: unknown): raw is PlayOptions => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.isShuffled === "boolean" &&
    (candidate.startLevel === 1 ||
      candidate.startLevel === 2 ||
      candidate.startLevel === 3) &&
    typeof candidate.isTableMode === "boolean" &&
    isStringList(candidate.players) &&
    candidate.players.length <= MAX_PLAYERS
  );
};

const isSavedProgress = (raw: unknown): raw is SavedProgress | null => {
  if (raw === null) return true;
  if (typeof raw !== "object") return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.deckId === "string" &&
    isStringList(candidate.order) &&
    isNonNegativeInteger(candidate.position) &&
    isStringList(candidate.hiddenCardIds) &&
    isNonNegativeInteger(candidate.turnIndex) &&
    (candidate.firstStarterIndex === undefined ||
      isNonNegativeInteger(candidate.firstStarterIndex)) &&
    isPlayOptions(candidate.options) &&
    typeof candidate.startedAt === "number" &&
    typeof candidate.updatedAt === "number"
  );
};

export const progressStore = createStore<SavedProgress | null>(
  "progress",
  null,
  isSavedProgress
);

/** Null when absent, invalid, empty or finished. Keeps the stored reference, so it stays stable. */
const toResumableProgress = (
  stored: SavedProgress | null
): SavedProgress | null =>
  stored === null ||
  stored.order.length === 0 ||
  stored.position >= stored.order.length
    ? null
    : stored;

export function loadProgress(): SavedProgress | null {
  return toResumableProgress(progressStore.get());
}

export function saveProgress(progress: SavedProgress): void {
  progressStore.set(progress);
}

export function clearProgress(): void {
  progressStore.set(null);
}

export function useProgress(): SavedProgress | null {
  return toResumableProgress(useStore(progressStore));
}

/**
 * v1 English deck titles mapped to v2 deck ids. Fixed on purpose: live deck titles may be
 * renamed later, and these v1 titles never change.
 */
const LEGACY_TITLE_TO_DECK_ID: Record<string, string> = {
  unravel: "unravel",
  "first date": "first-date",
  "date night": "date-night",
  "beyond the surface": "beyond-the-surface",
  "spark flow": "spark-flow",
  "mingling at bairro alto": "bairro-alto",
  "flames of desire": "flames-of-desire",
  "inferno of lust": "inferno-of-lust",
  "safe kink": "safe-kink",
  "aftercare glow": "aftercare-glow",
  "hedonistic societies": "hedonistic-societies",
  "polyamorous passions": "polyamorous-passions",
  "silly goose": "silly-goose",
  "queer vibes": "queer-vibes",
};

const LEGACY_PROGRESS_KEY = "gameProgress";
const LEGACY_AGE_KEY = "ageConfirmed";
/** The last v1 release, so returning players see what changed since then. */
const LEGACY_APP_VERSION = "1.0.0";

interface LegacyProgress {
  savedCounter: number;
  savedTitle: string;
}

const readLegacyProgress = (rawText: string): LegacyProgress | null => {
  try {
    const parsed: unknown = JSON.parse(rawText);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Record<string, unknown>;
    if (
      typeof candidate.savedCounter !== "number" ||
      !Number.isFinite(candidate.savedCounter) ||
      typeof candidate.savedTitle !== "string"
    ) {
      return null;
    }
    return {
      savedCounter: candidate.savedCounter,
      savedTitle: candidate.savedTitle,
    };
  } catch {
    return null;
  }
};

const readLegacyItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const removeLegacyItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage is blocked; nothing to remove.
  }
};

/**
 * One-time migration of the v1 keys `gameProgress` and `ageConfirmed`.
 * The v1 English title (trimmed, case-insensitive) maps to a deck id through
 * LEGACY_TITLE_TO_DECK_ID, and that id is looked up in `decks`.
 * The v1 counter becomes the position in that deck's curated order. Progress
 * is dropped when no deck matches, the counter is past the last card, or v2
 * progress already exists. A v1 player with no v2 settings yet gets
 * lastSeenVersion "1.0.0", so What's new treats them as returning and lists the
 * v2 changes. Both v1 keys are removed afterwards.
 */
export function migrateLegacyStorage(decks: Deck[]): void {
  const legacyProgressText = readLegacyItem(LEGACY_PROGRESS_KEY);
  const legacyAgeText = readLegacyItem(LEGACY_AGE_KEY);
  if (legacyProgressText === null && legacyAgeText === null) return;

  if (legacyAgeText === "true") confirmAge();

  if (settingsStore.get().lastSeenVersion === "") {
    settingsStore.set((previous) => ({
      ...previous,
      lastSeenVersion: LEGACY_APP_VERSION,
    }));
  }

  if (legacyProgressText !== null && progressStore.get() === null) {
    const legacyProgress = readLegacyProgress(legacyProgressText);
    const normalizedTitle =
      legacyProgress?.savedTitle.trim().toLowerCase() ?? "";
    const matchedDeckId = Object.hasOwn(
      LEGACY_TITLE_TO_DECK_ID,
      normalizedTitle
    )
      ? LEGACY_TITLE_TO_DECK_ID[normalizedTitle]
      : undefined;
    const matchedDeck = matchedDeckId
      ? decks.find((deck) => deck.id === matchedDeckId)
      : undefined;
    if (legacyProgress && matchedDeck) {
      const order = matchedDeck.cards.map((card) => card.id);
      const position = Math.min(
        Math.max(Math.floor(legacyProgress.savedCounter), 0),
        order.length
      );
      if (position < order.length) {
        const now = Date.now();
        saveProgress({
          deckId: matchedDeck.id,
          order,
          position,
          hiddenCardIds: [],
          turnIndex: 0,
          options: {
            isShuffled: false,
            startLevel: 1,
            isTableMode: false,
            players: [],
          },
          startedAt: now,
          updatedAt: now,
        });
      }
    }
  }

  removeLegacyItem(LEGACY_PROGRESS_KEY);
  removeLegacyItem(LEGACY_AGE_KEY);
}
