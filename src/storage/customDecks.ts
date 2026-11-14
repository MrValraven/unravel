import { CUSTOM_DECK_PREFIX, type CardType } from "../content/types";
import { createStore, useStore } from "./createStore";

export const MAX_CUSTOM_DECKS = 50;
export const MAX_CARDS_PER_CUSTOM_DECK = 200;

export interface CustomCard {
  id: string;
  type: CardType;
  text: string;
}

export interface CustomDeck {
  /** "custom-<10 random base36 characters>" */
  id: string;
  title: string;
  cards: CustomCard[];
  createdAt: number;
  updatedAt: number;
}

const cardTypes: readonly string[] = ["question", "challenge", "everyone"];

const isCustomCard = (raw: unknown): raw is CustomCard => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    cardTypes.includes(candidate.type) &&
    typeof candidate.text === "string"
  );
};

const isCustomDeck = (raw: unknown): raw is CustomDeck => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.startsWith(CUSTOM_DECK_PREFIX) &&
    typeof candidate.title === "string" &&
    Array.isArray(candidate.cards) &&
    candidate.cards.every(isCustomCard) &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number"
  );
};

const isCustomDeckList = (raw: unknown): raw is CustomDeck[] =>
  Array.isArray(raw) && raw.every(isCustomDeck);

/**
 * Keeps every valid deck. Invalid cards are dropped from their deck, and a deck whose
 * cards were all invalid is dropped too. One bad entry never empties the whole list.
 */
const normalizeCustomDecks = (raw: unknown): CustomDeck[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const validDecks: CustomDeck[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.id !== "string" ||
      !candidate.id.startsWith(CUSTOM_DECK_PREFIX) ||
      typeof candidate.title !== "string" ||
      !Array.isArray(candidate.cards) ||
      typeof candidate.createdAt !== "number" ||
      typeof candidate.updatedAt !== "number"
    ) {
      continue;
    }
    const validCards = candidate.cards.filter(isCustomCard);
    if (validCards.length === 0 && candidate.cards.length > 0) continue;
    validDecks.push({
      id: candidate.id,
      title: candidate.title,
      cards: validCards,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });
  }
  return validDecks;
};

export const customDecksStore = createStore<CustomDeck[]>(
  "customDecks",
  [],
  isCustomDeckList,
  normalizeCustomDecks
);

export function listCustomDecks(): CustomDeck[] {
  return customDecksStore.get();
}

export function getCustomDeck(id: string): CustomDeck | undefined {
  return customDecksStore.get().find((deck) => deck.id === id);
}

/** True while a brand-new deck still fits under MAX_CUSTOM_DECKS. */
export function canCreateCustomDeck(): boolean {
  return customDecksStore.get().length < MAX_CUSTOM_DECKS;
}

/**
 * Inserts or replaces by id. Cards past MAX_CARDS_PER_CUSTOM_DECK are dropped.
 * A new deck is ignored once MAX_CUSTOM_DECKS exists (check canCreateCustomDeck first).
 */
export function saveCustomDeck(deck: CustomDeck): void {
  const cappedDeck: CustomDeck = {
    ...deck,
    cards: deck.cards.slice(0, MAX_CARDS_PER_CUSTOM_DECK),
  };
  customDecksStore.set((previous) => {
    const existingIndex = previous.findIndex((entry) => entry.id === deck.id);
    if (existingIndex === -1) {
      return previous.length >= MAX_CUSTOM_DECKS
        ? previous
        : [...previous, cappedDeck];
    }
    return previous.map((entry, index) =>
      index === existingIndex ? cappedDeck : entry
    );
  });
}

export function deleteCustomDeck(id: string): void {
  customDecksStore.set((previous) =>
    previous.some((deck) => deck.id === id)
      ? previous.filter((deck) => deck.id !== id)
      : previous
  );
}

const ID_LENGTH = 10;
const BASE36_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
// Largest multiple of 36 that fits in a byte; bytes above it are redrawn so every character is equally likely.
const UNBIASED_BYTE_LIMIT = 252;

export function createCustomDeckId(): string {
  let randomPart = "";
  while (randomPart.length < ID_LENGTH) {
    const randomBytes = new Uint8Array(ID_LENGTH);
    crypto.getRandomValues(randomBytes);
    for (const randomByte of randomBytes) {
      if (randomPart.length === ID_LENGTH) break;
      if (randomByte < UNBIASED_BYTE_LIMIT) {
        randomPart += BASE36_ALPHABET[randomByte % 36];
      }
    }
  }
  return CUSTOM_DECK_PREFIX + randomPart;
}

export function useCustomDecks(): CustomDeck[] {
  return useStore(customDecksStore);
}
