import type { CustomDeck } from "../storage/customDecks";
import { getDailyCard } from "./dailyCard";
import {
  categoryAccents,
  decks,
  getBuiltinDeck,
  getVisibleDecks,
  isDeckInSeason,
} from "./decks";
import { findCardById, resolveDeck } from "./resolveDeck";
import { FAVOURITES_DECK_ID, type DeckMeta } from "./types";

const baseMeta: DeckMeta = {
  id: "test-deck",
  title: { en: "Test deck", pt: "Baralho de teste" },
  description: { en: "Test", pt: "Teste" },
  category: "friends",
  tag: "seasonal",
  isAdult: false,
  icon: "calendar",
  accent: "#eebbc3",
  audiences: ["friends"],
  moods: ["light"],
};

const onDay = (month: number, day: number, year = 2026): Date =>
  new Date(year, month - 1, day, 12);

const firstCardOf = (deckId: string) => {
  const card = getBuiltinDeck(deckId)?.cards[0];
  if (!card) {
    throw new Error(`Test setup: deck "${deckId}" has no first card.`);
  }
  return card;
};

describe("isDeckInSeason", () => {
  it("treats a deck without a season as always in season", () => {
    expect(isDeckInSeason(baseMeta, onDay(2, 29, 2028))).toBe(true);
  });

  it("includes both ends of a window inside one year", () => {
    const summer = { ...baseMeta, season: { start: "06-01", end: "08-31" } };
    expect(isDeckInSeason(summer, onDay(6, 1))).toBe(true);
    expect(isDeckInSeason(summer, onDay(8, 31))).toBe(true);
    expect(isDeckInSeason(summer, onDay(5, 31))).toBe(false);
    expect(isDeckInSeason(summer, onDay(9, 1))).toBe(false);
  });

  it("wraps a window across the year end", () => {
    const holidays = { ...baseMeta, season: { start: "12-15", end: "01-07" } };
    expect(isDeckInSeason(holidays, onDay(12, 15))).toBe(true);
    expect(isDeckInSeason(holidays, onDay(12, 31))).toBe(true);
    expect(isDeckInSeason(holidays, onDay(1, 1))).toBe(true);
    expect(isDeckInSeason(holidays, onDay(1, 7))).toBe(true);
    expect(isDeckInSeason(holidays, onDay(1, 8))).toBe(false);
    expect(isDeckInSeason(holidays, onDay(12, 14))).toBe(false);
    expect(isDeckInSeason(holidays, onDay(7, 1))).toBe(false);
  });

  it("lists every deck without a season as visible", () => {
    const unseasoned = decks.filter((deck) => !deck.season);
    expect(getVisibleDecks(onDay(7, 1))).toEqual(
      expect.arrayContaining(unseasoned)
    );
  });
});

describe("getDailyCard", () => {
  it("returns the same card all day", () => {
    const morning = getDailyCard(new Date(2026, 10, 14, 0, 5));
    const evening = getDailyCard(new Date(2026, 10, 14, 23, 55));
    expect(evening.card.id).toBe(morning.card.id);
  });

  it("picks a level 1 question from a deck anyone can open", () => {
    for (let dayOfMonth = 1; dayOfMonth <= 28; dayOfMonth += 1) {
      const { card, deck } = getDailyCard(onDay(3, dayOfMonth));
      expect(card.level).toBe(1);
      expect(card.type).toBe("question");
      expect(deck.isAdult).toBe(false);
      expect(deck.cards).toContain(card);
    }
  });

  it("picks only decks in season on every day of a leap year", () => {
    const juneSeasonalDeckIds = ["pride", "santos-populares"];
    for (let dayIndex = 0; dayIndex < 366; dayIndex += 1) {
      const today = new Date(2028, 0, 1 + dayIndex, 12);
      const monthDay = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const { deck } = getDailyCard(today);
      expect(isDeckInSeason(deck, today), monthDay).toBe(true);
      if (monthDay >= "01-08" && monthDay <= "12-25") {
        expect(deck.id, monthDay).not.toBe("new-year");
      }
      if (today.getMonth() === 5) {
        const isJuneDeck =
          deck.season === undefined || juneSeasonalDeckIds.includes(deck.id);
        expect(isJuneDeck, monthDay).toBe(true);
      }
    }
  });
});

describe("resolveDeck", () => {
  const emptySources = { favouriteIds: [], customDecks: [] };

  it("resolves a builtin deck by id", () => {
    expect(resolveDeck("first-date", emptySources)).toBe(
      getBuiltinDeck("first-date")
    );
    expect(resolveDeck("no-such-deck", emptySources)).toBeUndefined();
  });

  it("builds the favourites deck in the order cards were favourited", () => {
    const datingCard = firstCardOf("first-date");
    const friendsCard = firstCardOf("unravel");
    const favourites = resolveDeck(FAVOURITES_DECK_ID, {
      favouriteIds: [datingCard.id, "removed-card-001", friendsCard.id],
      customDecks: [],
    });
    expect(favourites?.id).toBe(FAVOURITES_DECK_ID);
    expect(favourites?.category).toBe("friends");
    expect(favourites?.cards.map((card) => card.id)).toEqual([
      datingCard.id,
      friendsCard.id,
    ]);
    expect(favourites?.isAdult).toBe(false);
    expect(favourites?.accent).toBe(categoryAccents.dating);
  });

  it("marks the favourites deck adult when any card comes from an adult deck", () => {
    const adultCard = firstCardOf("flames-of-desire");
    const friendsCard = firstCardOf("unravel");
    const favourites = resolveDeck(FAVOURITES_DECK_ID, {
      favouriteIds: [friendsCard.id, adultCard.id],
      customDecks: [],
    });
    expect(favourites?.isAdult).toBe(true);
  });

  it("returns no favourites deck when no favourite matches a card", () => {
    expect(resolveDeck(FAVOURITES_DECK_ID, emptySources)).toBeUndefined();
  });

  it("resolves a custom deck by id", () => {
    const customDeck: CustomDeck = {
      id: "custom-abc123",
      title: "Road trip",
      cards: [
        {
          id: "custom-abc123-1",
          type: "question",
          text: "Best road trip snack?",
        },
        {
          id: "custom-abc123-2",
          type: "challenge",
          text: "Sing the chorus of the next song",
        },
      ],
      createdAt: 1,
      updatedAt: 2,
    };
    const deck = resolveDeck("custom-abc123", {
      favouriteIds: [],
      customDecks: [customDeck],
    });
    expect(deck?.title).toEqual({ en: "Road trip", pt: "Road trip" });
    expect(deck?.isAdult).toBe(false);
    expect(deck?.accent).toBe(categoryAccents.friends);
    expect(deck?.cards.map((card) => card.type)).toEqual([
      "question",
      "challenge",
    ]);
    expect(deck?.cards[1]?.text.en).toBe("Sing the chorus of the next song");
    expect(
      resolveDeck("custom-missing", {
        favouriteIds: [],
        customDecks: [customDeck],
      })
    ).toBeUndefined();
  });
});

describe("findCardById", () => {
  it("finds a builtin card with its deck", () => {
    const card = firstCardOf("safe-kink");
    expect(findCardById(card.id)?.deck.id).toBe("safe-kink");
    expect(findCardById("unknown-card-001")).toBeUndefined();
  });
});
