import { categoryAccents, deckCategories, decks } from "./decks";
import { locales, type Card, type DeckPackFile } from "./types";

// Test-only discovery of every pack file on disk; the app imports packs statically in decks.ts.
const packModules = import.meta.glob<DeckPackFile>("./packs/*.json", {
  eager: true,
  import: "default",
});

const packsByFileId = new Map(
  Object.entries(packModules).map(([path, pack]) => [
    path.replace("./packs/", "").replace(".json", ""),
    pack,
  ])
);

const draftDeckIds = [
  "monthlyCheckup",
  "monthly-checkup",
  "networking",
  "flinta",
  "flinta-harmony",
  "neurospicy",
  "neurospicy-delight",
  "tunas",
  "portuguese-tunas",
  "selfreflection",
  "self-reflection",
  "domsub",
  "dom-sub",
  "lovesparks",
  "love-sparks",
];

const allCards: Card[] = decks.flatMap((deck) => deck.cards);
const emDash = "\u2014";

const findRepeated = (values: string[]): string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    }
    seen.add(value);
  }
  return [...repeated];
};

const normalizeText = (text: string): string => text.trim().toLowerCase();

describe("deck registry", () => {
  it("gives every deck a unique id", () => {
    expect(findRepeated(decks.map((deck) => deck.id))).toEqual([]);
  });

  it("has a pack file with the same id for every registered deck", () => {
    for (const deck of decks) {
      const pack = packsByFileId.get(deck.id);
      expect(pack, `missing src/content/packs/${deck.id}.json`).toBeDefined();
      expect(pack?.id).toBe(deck.id);
      expect(deck.cards).toEqual(pack?.cards);
    }
  });

  it("registers every pack file in src/content/packs", () => {
    const registeredIds = new Set(decks.map((deck) => deck.id));
    const unregistered = [...packsByFileId.keys()].filter(
      (fileId) => !registeredIds.has(fileId)
    );
    expect(unregistered).toEqual([]);
  });

  it("registers no draft deck", () => {
    const registeredDrafts = decks.filter((deck) =>
      draftDeckIds.includes(deck.id)
    );
    expect(registeredDrafts.map((deck) => deck.id)).toEqual([]);
  });

  it("fills deck titles, descriptions and category titles in every locale", () => {
    for (const locale of locales) {
      for (const deck of decks) {
        expect(
          deck.title[locale].trim(),
          `${deck.id} title (${locale})`
        ).not.toBe("");
        expect(
          deck.description[locale].trim(),
          `${deck.id} description (${locale})`
        ).not.toBe("");
      }
      for (const category of deckCategories) {
        expect(
          category.title[locale].trim(),
          `${category.key} title (${locale})`
        ).not.toBe("");
      }
    }
  });

  it("keeps em dashes out of deck and category text", () => {
    const deckTexts = decks.flatMap((deck) =>
      locales.flatMap((locale) => [
        deck.title[locale],
        deck.description[locale],
      ])
    );
    const categoryTexts = deckCategories.flatMap((category) =>
      locales.flatMap((locale) => [
        category.title[locale],
        category.note?.[locale] ?? "",
      ])
    );
    expect(
      [...deckTexts, ...categoryTexts].filter((text) => text.includes(emDash))
    ).toEqual([]);
  });
});

describe("deck accents", () => {
  it("gives every deck the tone of its category", () => {
    const mismatched = decks
      .filter((deck) => deck.accent !== categoryAccents[deck.category])
      .map((deck) => deck.id);
    expect(mismatched).toEqual([]);
  });

  it("keeps the palette to one tone per category", () => {
    const tones = new Set(Object.values(categoryAccents));
    expect(tones.size).toBe(deckCategories.length);
    expect(new Set(decks.map((deck) => deck.accent)).size).toBeLessThanOrEqual(
      tones.size
    );
  });
});

describe("deck cards", () => {
  it("gives every card a unique id", () => {
    expect(findRepeated(allCards.map((card) => card.id))).toEqual([]);
  });

  it("names every card id after its deck with a three digit number", () => {
    for (const deck of decks) {
      const idPattern = new RegExp(`^${deck.id}-\\d{3}$`);
      const mismatched = deck.cards.filter((card) => !idPattern.test(card.id));
      expect(
        mismatched.map((card) => card.id),
        deck.id
      ).toEqual([]);
    }
  });

  it("has English text on every card", () => {
    expect(
      allCards
        .filter((card) => card.text.en.trim() === "")
        .map((card) => card.id)
    ).toEqual([]);
  });

  it("has Portuguese text on every card", () => {
    expect(
      allCards
        .filter((card) => card.text.pt.trim() === "")
        .map((card) => card.id)
    ).toEqual([]);
  });

  it.each(locales)(
    "keeps every %s card text unique across all decks",
    (locale) => {
      const texts = allCards
        .map((card) => normalizeText(card.text[locale]))
        .filter((text) => text !== "");
      expect(findRepeated(texts)).toEqual([]);
    }
  );

  it("keeps every level between 1 and 3", () => {
    const outOfRange = allCards.filter(
      (card) => ![1, 2, 3].includes(card.level)
    );
    expect(outOfRange.map((card) => card.id)).toEqual([]);
  });

  it("uses only known card types", () => {
    const knownTypes = ["question", "challenge", "everyone"];
    const unknown = allCards.filter((card) => !knownTypes.includes(card.type));
    expect(unknown.map((card) => card.id)).toEqual([]);
  });

  it("puts timers only on challenges, as whole seconds from 30 to 120", () => {
    const timedCards = allCards.filter(
      (card) => card.timerSeconds !== undefined
    );
    const misplaced = timedCards.filter((card) => card.type !== "challenge");
    const outOfRange = timedCards.filter(
      (card) =>
        !Number.isInteger(card.timerSeconds) ||
        (card.timerSeconds ?? 0) < 30 ||
        (card.timerSeconds ?? 0) > 120
    );
    expect(misplaced.map((card) => card.id)).toEqual([]);
    expect(outOfRange.map((card) => card.id)).toEqual([]);
  });

  it("keeps em dashes out of card text", () => {
    const withEmDash = allCards.filter((card) =>
      locales.some((locale) => card.text[locale].includes(emDash))
    );
    expect(withEmDash.map((card) => card.id)).toEqual([]);
  });
});
