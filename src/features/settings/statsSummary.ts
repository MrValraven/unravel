import type { Deck } from "../../content/types";
import type { PlayStats } from "../../storage/stats";

const MILLISECONDS_PER_MINUTE = 60_000;

export interface StatsSummary {
  cardsSeen: number;
  decksFinished: number;
  minutesPlayed: number;
  /** The deck started most often that still exists; undefined when none does. */
  mostPlayedDeck: Deck | undefined;
  hasAnyPlay: boolean;
}

/**
 * Turns the raw counters into what "Your nights" shows. `findDeck` resolves a
 * builtin, favourites or custom deck id; ids it cannot resolve are skipped.
 * On a tie the deck counted first wins.
 */
export const summarizeStats = (
  stats: PlayStats,
  findDeck: (deckId: string) => Deck | undefined
): StatsSummary => {
  const decksFinished = Object.values(stats.decksFinished).reduce(
    (total, count) => total + count,
    0
  );

  let mostPlayedDeck: Deck | undefined;
  let highestStartCount = 0;
  for (const [deckId, startCount] of Object.entries(stats.decksStarted)) {
    if (startCount <= highestStartCount) continue;
    const deck = findDeck(deckId);
    if (!deck) continue;
    mostPlayedDeck = deck;
    highestStartCount = startCount;
  }

  const hasAnyPlay =
    stats.cardsSeen > 0 ||
    decksFinished > 0 ||
    stats.millisecondsPlayed > 0 ||
    Object.values(stats.decksStarted).some((count) => count > 0);

  return {
    cardsSeen: stats.cardsSeen,
    decksFinished,
    minutesPlayed: Math.round(
      stats.millisecondsPlayed / MILLISECONDS_PER_MINUTE
    ),
    mostPlayedDeck,
    hasAnyPlay,
  };
};
