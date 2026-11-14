import type { CustomDeck } from "../storage/customDecks";
import { categoryAccents, decks, getBuiltinDeck } from "./decks";
import {
  CUSTOM_DECK_PREFIX,
  FAVOURITES_DECK_ID,
  type Card,
  type Deck,
} from "./types";

export interface DeckSources {
  favouriteIds: string[];
  customDecks: CustomDeck[];
}

interface CardWithDeck {
  card: Card;
  deck: Deck;
}

let cardIndex: Map<string, CardWithDeck> | undefined;

const getCardIndex = (): Map<string, CardWithDeck> => {
  if (!cardIndex) {
    cardIndex = new Map(
      decks.flatMap((deck) =>
        deck.cards.map((card): [string, CardWithDeck] => [
          card.id,
          { card, deck },
        ])
      )
    );
  }
  return cardIndex;
};

/** Finds a builtin card and the deck it belongs to. */
export function findCardById(cardId: string): CardWithDeck | undefined {
  return getCardIndex().get(cardId);
}

/**
 * Every favourited builtin card, in the order favourited. Ids that no longer
 * match a card are skipped. Returns undefined when no card is left to play.
 */
const buildFavouritesDeck = (favouriteIds: string[]): Deck | undefined => {
  const favourites = favouriteIds
    .map((cardId) => findCardById(cardId))
    .filter((entry): entry is CardWithDeck => entry !== undefined);
  if (favourites.length === 0) {
    return undefined;
  }
  return {
    id: FAVOURITES_DECK_ID,
    title: { en: "Your favourites", pt: "As tuas favoritas" },
    description: {
      en: "The cards you saved while playing, in the order you saved them.",
      pt: "As cartas que guardaste enquanto jogavas, pela ordem em que as guardaste.",
    },
    category: "friends",
    tag: "",
    isAdult: favourites.some((entry) => entry.deck.isAdult),
    icon: "bookmark",
    // Favourites wear the pink tone, the app accent they were starred in.
    accent: categoryAccents.dating,
    audiences: [],
    moods: [],
    cards: favourites.map((entry) => entry.card),
  };
};

/** Custom decks hold one language, so the same text fills both locales. */
const customDeckToDeck = (customDeck: CustomDeck): Deck => ({
  id: customDeck.id,
  title: { en: customDeck.title, pt: customDeck.title },
  description: {
    en: "A deck you made on this device.",
    pt: "Um baralho que criaste neste dispositivo.",
  },
  category: "friends",
  tag: "",
  isAdult: false,
  icon: "edit",
  accent: categoryAccents.friends,
  audiences: [],
  moods: [],
  cards: customDeck.cards.map((customCard) => ({
    id: customCard.id,
    type: customCard.type,
    level: 1,
    text: { en: customCard.text, pt: customCard.text },
  })),
});

/** Resolves a builtin deck id, FAVOURITES_DECK_ID, or a custom deck id. */
export function resolveDeck(
  deckId: string,
  sources: DeckSources
): Deck | undefined {
  if (deckId === FAVOURITES_DECK_ID) {
    return buildFavouritesDeck(sources.favouriteIds);
  }
  if (deckId.startsWith(CUSTOM_DECK_PREFIX)) {
    const customDeck = sources.customDecks.find(
      (candidate) => candidate.id === deckId
    );
    return customDeck ? customDeckToDeck(customDeck) : undefined;
  }
  return getBuiltinDeck(deckId);
}
