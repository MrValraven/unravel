import type { CustomDeck } from "../storage/customDecks";
import { getDailyCard } from "./dailyCard";
import {
  categoryAccents,
  decks,
  getBuiltinDeck,
  getInSeasonDecks,
  getNextSeasonalDeck,
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

describe("halloween deck", () => {
  const getHalloween = () => {
    const deck = getBuiltinDeck("halloween");
    if (!deck)
      throw new Error('Test setup: deck "halloween" is not registered.');
    return deck;
  };

  it("registers halloween as a seasonal friends deck with the ghost icon", () => {
    expect(getHalloween()).toMatchObject({
      title: { en: "Halloween", pt: "Halloween" },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "ghost",
      accent: categoryAccents.friends,
      audiences: ["friends", "group", "new-people"],
      moods: ["playful", "deep"],
      season: { start: "10-01", end: "12-01" },
    });
  });

  it.each([
    [11, 16],
    [10, 1],
    [12, 1],
  ])("shows the halloween deck on %i-%i", (month, day) => {
    expect(isDeckInSeason(getHalloween(), onDay(month, day))).toBe(true);
    expect(getVisibleDecks(onDay(month, day)).map((deck) => deck.id)).toContain(
      "halloween"
    );
  });

  it.each([
    [9, 30],
    [12, 2],
  ])("hides the halloween deck on %i-%i", (month, day) => {
    expect(isDeckInSeason(getHalloween(), onDay(month, day))).toBe(false);
    expect(
      getVisibleDecks(onDay(month, day)).map((deck) => deck.id)
    ).not.toContain("halloween");
  });
});

describe("summer-nights deck", () => {
  const getSummerNights = () => {
    const deck = getBuiltinDeck("summer-nights");
    if (!deck)
      throw new Error('Test setup: deck "summer-nights" is not registered.');
    return deck;
  };

  it("registers summer-nights as a seasonal friends deck with the sun icon", () => {
    expect(getSummerNights()).toMatchObject({
      title: { en: "Summer Nights" },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "sun",
      accent: categoryAccents.friends,
      audiences: ["friends", "group", "new-people"],
      moods: ["light", "playful"],
      season: { start: "07-01", end: "09-30" },
    });
  });

  it("registers summer-nights between santos-populares and halloween", () => {
    const ids = decks.map((deck) => deck.id);
    const start = ids.indexOf("santos-populares");
    expect(ids.slice(start, start + 3)).toEqual([
      "santos-populares",
      "summer-nights",
      "halloween",
    ]);
  });

  it.each([
    [7, 1],
    [9, 30],
  ])("shows Summer Nights on %i-%i", (month, day) => {
    expect(isDeckInSeason(getSummerNights(), onDay(month, day))).toBe(true);
    expect(getVisibleDecks(onDay(month, day)).map((deck) => deck.id)).toContain(
      "summer-nights"
    );
  });

  it.each([
    [6, 30],
    [10, 1],
  ])("hides Summer Nights on %i-%i", (month, day) => {
    expect(isDeckInSeason(getSummerNights(), onDay(month, day))).toBe(false);
    expect(
      getVisibleDecks(onDay(month, day)).map((deck) => deck.id)
    ).not.toContain("summer-nights");
  });
});

describe("spring-reset deck", () => {
  const getSpringReset = () => {
    const deck = getBuiltinDeck("spring-reset");
    if (!deck)
      throw new Error('Test setup: deck "spring-reset" is not registered.');
    return deck;
  };

  it("registers spring-reset as a seasonal friends deck with the sunrise icon", () => {
    expect(getSpringReset()).toMatchObject({
      title: { en: "Spring Reset" },
      category: "friends",
      tag: "seasonal",
      isAdult: false,
      icon: "sunrise",
      accent: categoryAccents.friends,
      audiences: ["friends", "partner", "group"],
      moods: ["light", "deep"],
      season: { start: "03-01", end: "05-31" },
    });
  });

  it("registers spring-reset right after valentines", () => {
    const ids = decks.map((deck) => deck.id);
    expect(ids[ids.indexOf("valentines") + 1]).toBe("spring-reset");
  });

  it.each([
    [3, 1],
    [5, 31],
  ])("shows Spring Reset on %i-%i", (month, day) => {
    expect(isDeckInSeason(getSpringReset(), onDay(month, day))).toBe(true);
    expect(getVisibleDecks(onDay(month, day)).map((deck) => deck.id)).toContain(
      "spring-reset"
    );
  });

  it.each([
    [2, 28],
    [6, 1],
  ])("hides Spring Reset on %i-%i", (month, day) => {
    expect(isDeckInSeason(getSpringReset(), onDay(month, day))).toBe(false);
    expect(
      getVisibleDecks(onDay(month, day)).map((deck) => deck.id)
    ).not.toContain("spring-reset");
  });
});

describe("group-night deck", () => {
  it("registers group-night as a new friends deck for groups", () => {
    expect(getBuiltinDeck("group-night")).toMatchObject({
      title: { en: "Group Night" },
      category: "friends",
      tag: "new",
      isAdult: false,
      icon: "users",
      accent: categoryAccents.friends,
      audiences: ["group", "friends", "new-people"],
      moods: ["playful", "light"],
    });
    expect(getBuiltinDeck("group-night")?.season).toBeUndefined();
  });

  it("registers group-night between queer-vibes and pride", () => {
    const ids = decks.map((deck) => deck.id);
    const start = ids.indexOf("queer-vibes");
    expect(ids.slice(start, start + 3)).toEqual([
      "queer-vibes",
      "group-night",
      "pride",
    ]);
  });
});

describe("christmas decks", () => {
  const christmasDeckIds = ["christmas-table", "friendsmas"];
  const getDeck = (deckId: string) => {
    const deck = getBuiltinDeck(deckId);
    if (!deck)
      throw new Error(`Test setup: deck "${deckId}" is not registered.`);
    return deck;
  };
  const sharedMeta = {
    category: "friends",
    tag: "seasonal",
    isAdult: false,
    accent: categoryAccents.friends,
    season: { start: "12-01", end: "01-06" },
  };

  it("registers christmas-table as a seasonal family deck with the tree icon", () => {
    expect(getDeck("christmas-table")).toMatchObject({
      ...sharedMeta,
      title: { en: "Christmas at the Table", pt: "Natal à Mesa" },
      tagline: {
        en: "Questions for every age at the table",
        pt: "Perguntas para todas as idades à mesa",
      },
      icon: "tree",
      audiences: ["group", "friends"],
      moods: ["light", "playful"],
    });
  });

  it("registers friendsmas as a seasonal friends deck with the snowflake icon", () => {
    expect(getDeck("friendsmas")).toMatchObject({
      ...sharedMeta,
      title: { en: "Friendsmas", pt: "Natal entre Amigos" },
      tagline: {
        en: "Christmas with the family you choose",
        pt: "O Natal com a família que escolhemos",
      },
      icon: "snowflake",
      audiences: ["friends", "group"],
      moods: ["playful", "deep"],
    });
  });

  it("registers both between halloween and new-year, in calendar order", () => {
    const ids = decks.map((deck) => deck.id);
    const start = ids.indexOf("halloween");
    expect(ids.slice(start, start + 4)).toEqual([
      "halloween",
      "christmas-table",
      "friendsmas",
      "new-year",
    ]);
  });

  it.each([
    [12, 1],
    [12, 25],
    [1, 6],
  ])("shows both christmas decks on %i-%i", (month, day) => {
    for (const deckId of christmasDeckIds) {
      expect(isDeckInSeason(getDeck(deckId), onDay(month, day)), deckId).toBe(
        true
      );
    }
    expect(getVisibleDecks(onDay(month, day)).map((deck) => deck.id)).toEqual(
      expect.arrayContaining(christmasDeckIds)
    );
  });

  it.each([
    [11, 30],
    [1, 7],
  ])("hides both christmas decks on %i-%i", (month, day) => {
    const visibleIds = getVisibleDecks(onDay(month, day)).map(
      (deck) => deck.id
    );
    for (const deckId of christmasDeckIds) {
      expect(isDeckInSeason(getDeck(deckId), onDay(month, day)), deckId).toBe(
        false
      );
      expect(visibleIds, deckId).not.toContain(deckId);
    }
  });
});

describe("getInSeasonDecks", () => {
  it("lists Halloween as in season on 2026-11-23", () => {
    expect(getInSeasonDecks(onDay(11, 23)).map((deck) => deck.id)).toEqual([
      "halloween",
    ]);
  });

  it("returns nothing for decks without a season", () => {
    const ids = getInSeasonDecks(onDay(11, 23)).map((deck) => deck.id);
    expect(ids).not.toContain("unravel");
    expect(getInSeasonDecks(onDay(1, 20))).toEqual([]);
  });

  it("lists Spring Reset in March and Summer Nights in August", () => {
    expect(getInSeasonDecks(onDay(3, 15)).map((deck) => deck.id)).toEqual([
      "spring-reset",
    ]);
    expect(getInSeasonDecks(onDay(8, 15)).map((deck) => deck.id)).toEqual([
      "summer-nights",
    ]);
  });

  it("keeps registry order when several decks share a season", () => {
    expect(getInSeasonDecks(onDay(12, 28)).map((deck) => deck.id)).toEqual([
      "christmas-table",
      "friendsmas",
      "new-year",
    ]);
  });
});

describe("getNextSeasonalDeck", () => {
  it("names Valentine's Day as coming up on 2027-01-20", () => {
    expect(getNextSeasonalDeck(new Date(2027, 0, 20))?.deck.id).toBe(
      "valentines"
    );
  });

  it("finds the next season after Valentine's Day", () => {
    expect(getNextSeasonalDeck(new Date(2027, 1, 20))?.deck.id).toBe(
      "spring-reset"
    );
  });

  it("wraps the year end when looking for the next season", () => {
    const next = getNextSeasonalDeck(new Date(2026, 11, 30));
    expect(next?.deck.id).toBe("valentines");
    expect(next?.startsOn).toEqual(new Date(2027, 1, 1));
  });

  it("keeps registry order when two seasons start on the same day", () => {
    expect(getNextSeasonalDeck(new Date(2027, 4, 10))?.deck.id).toBe("pride");
  });
});
