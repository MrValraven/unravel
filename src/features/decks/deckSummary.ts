import type {
  Card,
  DeckCategory,
  DeckMeta,
  IntensityLevel,
} from "../../content/types";

export type LevelCounts = Record<IntensityLevel, number>;

export const intensityLevels: readonly IntensityLevel[] = [1, 2, 3];

export const countCardsByLevel = (cards: Card[]): LevelCounts => {
  const counts: LevelCounts = { 1: 0, 2: 0, 3: 0 };
  for (const card of cards) counts[card.level] += 1;
  return counts;
};

/**
 * The first cards a deck plays in curated order, warm cards first, so samples
 * show how the deck opens. Array sort is stable, so deck order holds inside a level.
 */
export const getSampleCards = (cards: Card[], sampleCount: number): Card[] =>
  // With fewer warm cards than samples wanted, the rest come from the next level up.
  [...cards]
    .sort((first, second) => first.level - second.level)
    .slice(0, sampleCount);

/** Fragment id of a category section on the picker, so deck pages can link to it: /decks#decks-dating. */
export const categorySectionId = (category: DeckCategory): string =>
  `decks-${category}`;

/** Points for each way two decks are alike. Category counts most, then audiences, then moods. */
const SAME_CATEGORY_SCORE = 3;
const SHARED_AUDIENCE_SCORE = 2;
const SHARED_MOOD_SCORE = 1;

const countShared = <Value>(first: Value[], second: Value[]): number =>
  first.filter((value) => second.includes(value)).length;

/**
 * Decks to suggest on a deck page: same category or shared audiences first,
 * moods as a tie breaker, registry order after that. A deck for everyone never
 * suggests an 18+ deck. Decks with nothing in common are left out.
 */
export const getRelatedDecks = <CandidateDeck extends DeckMeta>(
  deck: DeckMeta,
  candidates: CandidateDeck[],
  limit: number
): CandidateDeck[] =>
  candidates
    .filter(
      (candidate) =>
        candidate.id !== deck.id && (deck.isAdult || !candidate.isAdult)
    )
    .map((candidate, index) => {
      const isSameCategory = candidate.category === deck.category;
      const sharedAudiences = countShared(candidate.audiences, deck.audiences);
      const score =
        (isSameCategory ? SAME_CATEGORY_SCORE : 0) +
        sharedAudiences * SHARED_AUDIENCE_SCORE +
        countShared(candidate.moods, deck.moods) * SHARED_MOOD_SCORE;
      return {
        candidate,
        index,
        score,
        isRelated: isSameCategory || sharedAudiences > 0,
      };
    })
    .filter((entry) => entry.isRelated)
    .sort(
      (first, second) =>
        second.score - first.score || first.index - second.index
    )
    .slice(0, limit)
    .map((entry) => entry.candidate);
