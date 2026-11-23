import { createStore, useStore } from "./createStore";

export interface PlayStats {
  decksStarted: Record<string, number>;
  decksFinished: Record<string, number>;
  cardsSeen: number;
  millisecondsPlayed: number;
}

export const emptyStats: PlayStats = {
  decksStarted: {},
  decksFinished: {},
  cardsSeen: 0,
  millisecondsPlayed: 0,
};

const isCountRecord = (raw: unknown): raw is Record<string, number> =>
  typeof raw === "object" &&
  raw !== null &&
  !Array.isArray(raw) &&
  Object.values(raw).every(
    (count) => typeof count === "number" && Number.isFinite(count)
  );

const isPlayStats = (raw: unknown): raw is PlayStats => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    isCountRecord(candidate.decksStarted) &&
    isCountRecord(candidate.decksFinished) &&
    typeof candidate.cardsSeen === "number" &&
    Number.isFinite(candidate.cardsSeen) &&
    typeof candidate.millisecondsPlayed === "number" &&
    Number.isFinite(candidate.millisecondsPlayed)
  );
};

const keepValidCounts = (raw: unknown): Record<string, number> => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const validCounts: Record<string, number> = {};
  for (const [deckId, count] of Object.entries(raw)) {
    if (typeof count === "number" && Number.isFinite(count)) {
      validCounts[deckId] = count;
    }
  }
  return validCounts;
};

const keepValidTotal = (raw: unknown): number =>
  typeof raw === "number" && Number.isFinite(raw) ? raw : 0;

/** Keeps every valid counter; an invalid counter drops to zero on its own. */
export const normalizePlayStats = (raw: unknown): PlayStats | undefined => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const candidate = raw as Record<string, unknown>;
  return {
    decksStarted: keepValidCounts(candidate.decksStarted),
    decksFinished: keepValidCounts(candidate.decksFinished),
    cardsSeen: keepValidTotal(candidate.cardsSeen),
    millisecondsPlayed: keepValidTotal(candidate.millisecondsPlayed),
  };
};

export const statsStore = createStore<PlayStats>(
  "stats",
  emptyStats,
  isPlayStats,
  normalizePlayStats
);

export function recordDeckStart(deckId: string): void {
  statsStore.set((previous) => ({
    ...previous,
    decksStarted: {
      ...previous.decksStarted,
      [deckId]: (previous.decksStarted[deckId] ?? 0) + 1,
    },
  }));
}

export function recordCardSeen(): void {
  statsStore.set((previous) => ({
    ...previous,
    cardsSeen: previous.cardsSeen + 1,
  }));
}

export function recordDeckFinish(
  deckId: string,
  millisecondsPlayed: number
): void {
  const safeMilliseconds =
    Number.isFinite(millisecondsPlayed) && millisecondsPlayed > 0
      ? millisecondsPlayed
      : 0;
  statsStore.set((previous) => ({
    ...previous,
    decksFinished: {
      ...previous.decksFinished,
      [deckId]: (previous.decksFinished[deckId] ?? 0) + 1,
    },
    millisecondsPlayed: previous.millisecondsPlayed + safeMilliseconds,
  }));
}

export function resetStats(): void {
  statsStore.set(emptyStats);
}

export function useStats(): PlayStats {
  return useStore(statsStore);
}
