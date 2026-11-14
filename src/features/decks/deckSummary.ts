import type { Card, IntensityLevel } from "../../content/types";

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
