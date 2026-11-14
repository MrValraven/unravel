import type { CardType } from "../../content/types";
import {
  MAX_CARDS_PER_CUSTOM_DECK,
  type CustomCard,
} from "../../storage/customDecks";

/** Rules every custom deck follows, shared by the editor and the share link decoder. */
export const TITLE_MAX_LENGTH = 60;
export const CARD_TEXT_MAX_LENGTH = 280;
export const MAX_CARDS = MAX_CARDS_PER_CUSTOM_DECK;
export const DEFAULT_CARD_TYPE: CardType = "question";
export const customCardTypes: readonly CardType[] = [
  "question",
  "challenge",
  "everyone",
];

export const isCardType = (value: unknown): value is CardType =>
  typeof value === "string" &&
  (customCardTypes as readonly string[]).includes(value);

export type TextProblem = "empty" | "too-long";

const findTextProblem = (
  text: string,
  maxLength: number
): TextProblem | undefined => {
  const trimmedText = text.trim();
  if (trimmedText.length === 0) return "empty";
  if (trimmedText.length > maxLength) return "too-long";
  return undefined;
};

export const findTitleProblem = (title: string): TextProblem | undefined =>
  findTextProblem(title, TITLE_MAX_LENGTH);

export const findCardTextProblem = (text: string): TextProblem | undefined =>
  findTextProblem(text, CARD_TEXT_MAX_LENGTH);

/** What a card holds before it gets an id. */
export interface CardContent {
  type: CardType;
  text: string;
}

/** A card about to be saved. `key` is its current id when it already belongs to the deck. */
export interface NumberableCard extends CardContent {
  key?: string;
}

const CARD_NUMBER_DIGITS = 3;

const formatCardId = (deckId: string, cardNumber: number): string =>
  `${deckId}-${String(cardNumber).padStart(CARD_NUMBER_DIGITS, "0")}`;

/** The number in `<deckId>-<digits>`, or undefined when the id belongs to another deck or is not numbered. */
export const readCardNumber = (
  deckId: string,
  cardId: string
): number | undefined => {
  const prefix = `${deckId}-`;
  if (!cardId.startsWith(prefix)) return undefined;
  const digits = cardId.slice(prefix.length);
  if (!/^\d+$/.test(digits)) return undefined;
  const cardNumber = Number(digits);
  return cardNumber > 0 ? cardNumber : undefined;
};

/**
 * Card ids are `<deckId>-<3 digits>`. A card whose key is already one of this deck's ids keeps
 * it, so a saved game still points at the same cards after an edit. New cards are numbered from
 * the highest number in use (kept cards and `previousCardIds`) plus one. Text is trimmed.
 */
export const numberCustomCards = (
  deckId: string,
  cards: NumberableCard[],
  previousCardIds: readonly string[] = []
): CustomCard[] => {
  const keptNumbers = cards.map((card) =>
    card.key === undefined ? undefined : readCardNumber(deckId, card.key)
  );
  const numbersInUse = [
    ...keptNumbers,
    ...previousCardIds.map((cardId) => readCardNumber(deckId, cardId)),
  ].filter((cardNumber): cardNumber is number => cardNumber !== undefined);
  let nextCardNumber = Math.max(0, ...numbersInUse) + 1;
  const usedIds = new Set<string>();

  return cards.map((card, cardIndex) => {
    const keptNumber = keptNumbers[cardIndex];
    let cardId = keptNumber === undefined ? undefined : card.key;
    if (cardId === undefined || usedIds.has(cardId)) {
      cardId = formatCardId(deckId, nextCardNumber);
      nextCardNumber += 1;
    }
    usedIds.add(cardId);
    return { id: cardId, type: card.type, text: card.text.trim() };
  });
};

/** True when a card was added or removed, so saved play order no longer matches the deck. */
export const hasCardListChanged = (
  previousCards: readonly { id: string }[],
  nextCards: readonly { id: string }[]
): boolean => {
  if (previousCards.length !== nextCards.length) return true;
  const previousIds = new Set(previousCards.map((card) => card.id));
  return nextCards.some((card) => !previousIds.has(card.id));
};
