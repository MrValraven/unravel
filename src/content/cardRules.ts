import type { CardType } from "./types";

/**
 * The rules every card follows, whatever made it: the packs, the custom deck editor,
 * share links, stored decks and the CSV tools. Picker order is the order here.
 */
export const cardTypes: readonly CardType[] = [
  "question",
  "challenge",
  "everyone",
  "vote",
  "hot-seat",
];

export const isCardType = (value: unknown): value is CardType =>
  typeof value === "string" && (cardTypes as readonly string[]).includes(value);

export const MIN_TIMER_SECONDS = 30;
export const MAX_TIMER_SECONDS = 120;

const timedCardTypes: readonly CardType[] = ["challenge", "hot-seat"];

/** Only challenge and hot-seat cards may carry `timerSeconds`. */
export const allowsTimer = (type: CardType): boolean =>
  timedCardTypes.includes(type);
