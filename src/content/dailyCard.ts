import { decks, isDeckInSeason } from "./decks";
import type { Card, Deck } from "./types";

interface DailyCardEntry {
  card: Card;
  deck: Deck;
}

/** Warm-up questions from decks anyone can open, in registry and deck order. Filtered by season per day. */
const warmUpEntries: DailyCardEntry[] = decks
  .filter((deck) => !deck.isAdult)
  .flatMap((deck) =>
    deck.cards
      .filter((card) => card.level === 1 && card.type === "question")
      .map((card) => ({ card, deck }))
  );

const padTwoDigits = (value: number): string => String(value).padStart(2, "0");

/** Local calendar day as "YYYY-MM-DD". */
const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;

/** 32-bit FNV-1a: small, stable across browsers, and spreads nearby dates apart. */
const hashString = (value: string): number => {
  let hash = 0x811c9dc5;
  for (
    let characterIndex = 0;
    characterIndex < value.length;
    characterIndex += 1
  ) {
    hash ^= value.charCodeAt(characterIndex);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** Same card all day for everyone: hash of "YYYY-MM-DD" over the level-1 questions of non-adult decks in season on that day. */
export function getDailyCard(today: Date = new Date()): DailyCardEntry {
  const dailyCardPool = warmUpEntries.filter((entry) =>
    isDeckInSeason(entry.deck, today)
  );
  const entry =
    dailyCardPool[hashString(toDateKey(today)) % dailyCardPool.length];
  if (!entry) {
    throw new Error(
      "Unravel: the card of the day has no cards to pick from because no non-adult deck in season today has a level 1 question."
    );
  }
  return entry;
}
