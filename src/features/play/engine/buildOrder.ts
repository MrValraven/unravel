import type { Card, IntensityLevel } from "../../../content/types";
import type { PlayOptions } from "../../../storage/progress";

const ascendingLevels: readonly IntensityLevel[] = [1, 2, 3];

/** Fisher-Yates shuffle on a copy of the list. */
const shuffleCards = (cards: Card[], random: () => number): Card[] => {
  const shuffledCards = [...cards];
  for (
    let cardIndex = shuffledCards.length - 1;
    cardIndex > 0;
    cardIndex -= 1
  ) {
    const swapIndex = Math.min(
      cardIndex,
      Math.floor(random() * (cardIndex + 1))
    );
    const heldCard = shuffledCards[cardIndex];
    const swappedCard = shuffledCards[swapIndex];
    if (heldCard === undefined || swappedCard === undefined) {
      continue;
    }
    shuffledCards[cardIndex] = swappedCard;
    shuffledCards[swapIndex] = heldCard;
  }
  return shuffledCards;
};

/**
 * Cards with level >= startLevel. Curated: deck order. Shuffled: shuffle inside
 * each level, levels stay ascending so intensity still rises. `random` is
 * injectable for tests.
 */
export function buildOrder(
  cards: Card[],
  options: PlayOptions,
  random: () => number = Math.random
): string[] {
  const playableCards = cards.filter(
    (card) => card.level >= options.startLevel
  );
  if (!options.isShuffled) {
    return playableCards.map((card) => card.id);
  }
  return ascendingLevels.flatMap((level) =>
    shuffleCards(
      playableCards.filter((card) => card.level === level),
      random
    ).map((card) => card.id)
  );
}
