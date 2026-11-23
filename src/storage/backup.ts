import {
  MAX_CARDS_PER_CUSTOM_DECK,
  MAX_CUSTOM_DECKS,
  customDecksStore,
  normalizeCustomDecks,
  type CustomDeck,
} from "./customDecks";
import { favouritesStore, isFavouriteIdList } from "./favourites";
import { requestPersistentStorage } from "./persistence";
import { normalizePlayStats, statsStore, type PlayStats } from "./stats";

export const BACKUP_FORMAT = "unravel-backup";
export const BACKUP_VERSION = 1;
/** Text longer than this is refused before it is parsed. */
export const MAX_BACKUP_FILE_CHARACTERS = 5_000_000;

/** What a backup carries. Settings are not part of it: they belong to the device. */
export interface BackupData {
  customDecks: CustomDeck[];
  favourites: string[];
  stats: PlayStats;
}

export interface BackupFile extends BackupData {
  format: typeof BACKUP_FORMAT;
  version: number;
  /** ISO 8601 */
  exportedAt: string;
}

export function createBackup(now: Date): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    customDecks: customDecksStore.get(),
    favourites: favouritesStore.get(),
    stats: statsStore.get(),
  };
}

const twoDigits = (value: number): string => String(value).padStart(2, "0");

/** `unravel-backup-YYYY-MM-DD.json`, with the date in the player's own time zone. */
export function buildBackupFileName(now: Date): string {
  return `unravel-backup-${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}.json`;
}

export type BackupProblem =
  "too-large" | "not-json" | "not-backup" | "newer-version";

export type ReadBackupResult =
  | {
      isValid: true;
      backup: BackupFile;
      deckCount: number;
      favouriteCount: number;
    }
  | { isValid: false; problem: BackupProblem };

/** One entry per id: the copy with the newest updatedAt, in the place its id first appeared. */
const dedupeDecks = (decks: CustomDeck[]): CustomDeck[] => {
  const decksById = new Map<string, CustomDeck>();
  for (const deck of decks) {
    const known = decksById.get(deck.id);
    if (!known || deck.updatedAt > known.updatedAt) {
      decksById.set(deck.id, {
        ...deck,
        cards: deck.cards.slice(0, MAX_CARDS_PER_CUSTOM_DECK),
      });
    }
  }
  return Array.from(decksById.values());
};

/**
 * Checks a backup file's text. Nothing is written here: the caller shows what was found
 * and applies it only after the player confirms.
 */
export function readBackup(text: string): ReadBackupResult {
  if (text.length > MAX_BACKUP_FILE_CHARACTERS) {
    return { isValid: false, problem: "too-large" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { isValid: false, problem: "not-json" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { isValid: false, problem: "not-backup" };
  }
  const candidate = parsed as Record<string, unknown>;
  if (
    candidate.format !== BACKUP_FORMAT ||
    typeof candidate.version !== "number" ||
    !Number.isInteger(candidate.version) ||
    candidate.version < 1
  ) {
    return { isValid: false, problem: "not-backup" };
  }
  // A newer file may be shaped differently, so its version is judged before its contents.
  if (candidate.version > BACKUP_VERSION) {
    return { isValid: false, problem: "newer-version" };
  }
  const customDecks = normalizeCustomDecks(candidate.customDecks);
  const stats = normalizePlayStats(candidate.stats);
  if (!customDecks || !stats || !isFavouriteIdList(candidate.favourites)) {
    return { isValid: false, problem: "not-backup" };
  }
  const decks = dedupeDecks(customDecks);
  const favourites = Array.from(new Set(candidate.favourites));
  return {
    isValid: true,
    backup: {
      format: BACKUP_FORMAT,
      version: candidate.version,
      exportedAt:
        typeof candidate.exportedAt === "string" ? candidate.exportedAt : "",
      customDecks: decks,
      favourites,
      stats,
    },
    deckCount: decks.length,
    favouriteCount: favourites.length,
  };
}

export interface BackupMergeReport {
  decksAdded: number;
  decksUpdated: number;
  /** New decks left out because the device already holds MAX_CUSTOM_DECKS. */
  decksSkipped: number;
  favouritesAdded: number;
}

const mergeCounters = (
  current: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> => {
  const merged = { ...current };
  for (const [deckId, count] of Object.entries(incoming)) {
    // Own keys only: a deck id such as "constructor" must not read Object.prototype.
    const currentCount = Object.hasOwn(merged, deckId)
      ? merged[deckId]
      : undefined;
    merged[deckId] = Math.max(currentCount ?? count, count);
  }
  return merged;
};

/**
 * Pure merge. Decks match by id and the newer updatedAt wins (an update never counts
 * against the cap); new decks are added in file order until MAX_CUSTOM_DECKS. Favourites
 * are the union, current order first. Stats keep the higher value of every counter.
 * Nothing is deleted, and merging the same incoming data again changes nothing.
 */
export function mergeBackupData(
  current: BackupData,
  incoming: BackupData
): { merged: BackupData; report: BackupMergeReport } {
  const report: BackupMergeReport = {
    decksAdded: 0,
    decksUpdated: 0,
    decksSkipped: 0,
    favouritesAdded: 0,
  };

  const customDecks = [...current.customDecks];
  for (const deck of incoming.customDecks) {
    const index = customDecks.findIndex((entry) => entry.id === deck.id);
    const existing = customDecks[index];
    if (existing) {
      if (deck.updatedAt > existing.updatedAt) {
        customDecks[index] = deck;
        report.decksUpdated += 1;
      }
    } else if (customDecks.length < MAX_CUSTOM_DECKS) {
      customDecks.push(deck);
      report.decksAdded += 1;
    } else {
      report.decksSkipped += 1;
    }
  }

  const favourites = [...current.favourites];
  const knownFavourites = new Set(favourites);
  for (const cardId of incoming.favourites) {
    if (knownFavourites.has(cardId)) continue;
    knownFavourites.add(cardId);
    favourites.push(cardId);
    report.favouritesAdded += 1;
  }

  const stats: PlayStats = {
    decksStarted: mergeCounters(
      current.stats.decksStarted,
      incoming.stats.decksStarted
    ),
    decksFinished: mergeCounters(
      current.stats.decksFinished,
      incoming.stats.decksFinished
    ),
    cardsSeen: Math.max(current.stats.cardsSeen, incoming.stats.cardsSeen),
    millisecondsPlayed: Math.max(
      current.stats.millisecondsPlayed,
      incoming.stats.millisecondsPlayed
    ),
  };

  return { merged: { customDecks, favourites, stats }, report };
}

/**
 * Merges a read backup into the three stores. A store whose value did not change is not
 * written. When any write is refused the stores that were touched go back to what they
 * held, so "isSaved: false" means the backup was not imported at all.
 */
export function applyBackup(backup: BackupFile): {
  report: BackupMergeReport;
  isSaved: boolean;
} {
  const current: BackupData = {
    customDecks: customDecksStore.get(),
    favourites: favouritesStore.get(),
    stats: statsStore.get(),
  };
  const { merged, report } = mergeBackupData(current, backup);

  const writes: Array<() => boolean> = [];
  const undoes: Array<() => void> = [];
  if (
    JSON.stringify(merged.customDecks) !== JSON.stringify(current.customDecks)
  ) {
    writes.push(() => customDecksStore.set(merged.customDecks));
    undoes.push(() => void customDecksStore.set(current.customDecks));
  }
  if (
    JSON.stringify(merged.favourites) !== JSON.stringify(current.favourites)
  ) {
    writes.push(() => favouritesStore.set(merged.favourites));
    undoes.push(() => void favouritesStore.set(current.favourites));
  }
  if (JSON.stringify(merged.stats) !== JSON.stringify(current.stats)) {
    writes.push(() => statsStore.set(merged.stats));
    undoes.push(() => void statsStore.set(current.stats));
  }

  for (const write of writes) {
    if (!write()) {
      for (const undo of undoes) undo();
      return { report, isSaved: false };
    }
  }
  if (writes.length > 0) requestPersistentStorage();
  return { report, isSaved: true };
}
