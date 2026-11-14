import type { Card, Deck, IntensityLevel } from "../../../content/types";
import type { PlayOptions } from "../../../storage/progress";

export const makeCard = (
  id: string,
  level: IntensityLevel,
  type: Card["type"] = "question"
): Card => ({ id, type, level, text: { en: id, pt: id } });

/** Nine cards: three per level, deliberately not sorted by level. */
export const mixedCards: Card[] = [
  makeCard("a-001", 2),
  makeCard("a-002", 1),
  makeCard("a-003", 3),
  makeCard("a-004", 1),
  makeCard("a-005", 2),
  makeCard("a-006", 3),
  makeCard("a-007", 1),
  makeCard("a-008", 2),
  makeCard("a-009", 3),
];

export const makeDeck = (cards: Card[] = mixedCards): Deck => ({
  id: "a",
  title: { en: "A", pt: "A" },
  description: { en: "A", pt: "A" },
  category: "friends",
  tag: "",
  isAdult: false,
  icon: "message",
  accent: "#eebbc3",
  audiences: ["friends"],
  moods: ["light"],
  cards,
});

export const makeOptions = (patch: Partial<PlayOptions> = {}): PlayOptions => ({
  isShuffled: false,
  startLevel: 1,
  isTableMode: false,
  players: [],
  ...patch,
});

/** Deterministic pseudo-random sequence (linear congruential generator). */
export const makeSeededRandom = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};
