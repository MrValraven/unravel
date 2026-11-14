import type { Audience, DeckMeta, Mood } from "../../content/types";

export type SpiceLevel = "none" | "a-little" | "all-in";

export interface FinderAnswers {
  audience: Audience;
  mood: Mood;
  spice: SpiceLevel;
}

export const AUDIENCE_WEIGHT = 3;
export const MOOD_WEIGHT = 2;
export const MAX_SUGGESTIONS = 3;

const hasSpicyMood = (deck: DeckMeta): boolean => deck.moods.includes("spicy");

/** Adult decks only appear when the player chose "all in". */
const isAllowedBySpice = (deck: DeckMeta, spice: SpiceLevel): boolean =>
  spice === "all-in" || !deck.isAdult;

/**
 * "None" adds nothing. "A little" rewards decks with a spicy mood. "All in"
 * rewards adult decks most, then other spicy decks.
 */
const getSpiceFit = (deck: DeckMeta, spice: SpiceLevel): number => {
  if (spice === "a-little") return hasSpicyMood(deck) ? 1 : 0;
  if (spice === "all-in") {
    if (deck.isAdult) return 2;
    return hasSpicyMood(deck) ? 1 : 0;
  }
  return 0;
};

export const scoreDeck = (deck: DeckMeta, answers: FinderAnswers): number =>
  (deck.audiences.includes(answers.audience) ? AUDIENCE_WEIGHT : 0) +
  (deck.moods.includes(answers.mood) ? MOOD_WEIGHT : 0) +
  getSpiceFit(deck, answers.spice);

/**
 * Up to three decks that fit the answers, best first. Decks with no matching
 * audience, mood or spice score zero and are left out. Equal scores keep the
 * order of `decks` (the registry order), so the result is deterministic.
 */
export function rankDecks<DeckType extends DeckMeta>(
  decks: readonly DeckType[],
  answers: FinderAnswers,
  limit: number = MAX_SUGGESTIONS
): DeckType[] {
  return decks
    .filter((deck) => isAllowedBySpice(deck, answers.spice))
    .map((deck, registryIndex) => ({
      deck,
      registryIndex,
      score: scoreDeck(deck, answers),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score || first.registryIndex - second.registryIndex
    )
    .slice(0, limit)
    .map((entry) => entry.deck);
}
