import { describe, it, expect } from "vitest";
import { decks, getVisibleDecks } from "../../content/decks";
import type { Audience, DeckMeta, Mood } from "../../content/types";
import {
  rankDecks,
  scoreDeck,
  type FinderAnswers,
  type SpiceLevel,
} from "./rankDecks";

const buildDeck = (
  id: string,
  audiences: Audience[],
  moods: Mood[],
  isAdult = false
): DeckMeta => ({
  id,
  title: { en: id, pt: id },
  description: { en: "", pt: "" },
  category: isAdult ? "adults" : "friends",
  tag: "",
  isAdult,
  icon: "heart",
  accent: "#eebbc3",
  audiences,
  moods,
});

const coffeeChat = buildDeck("coffee-chat", ["date"], ["light"]);
const deepTalk = buildDeck("deep-talk", ["partner"], ["deep"]);
const sillyNight = buildDeck("silly-night", ["friends", "group"], ["playful"]);
const flirtyDate = buildDeck("flirty-date", ["date"], ["playful", "spicy"]);
const afterDark = buildDeck("after-dark", ["partner"], ["spicy"], true);
const groupHeat = buildDeck("group-heat", ["group"], ["spicy", "deep"], true);

const registry = [
  coffeeChat,
  deepTalk,
  sillyNight,
  flirtyDate,
  afterDark,
  groupHeat,
];

const answers = (overrides: Partial<FinderAnswers> = {}): FinderAnswers => ({
  audience: "date",
  mood: "light",
  spice: "none",
  ...overrides,
});

const rankedIds = (finderAnswers: FinderAnswers) =>
  rankDecks(registry, finderAnswers).map((deck) => deck.id);

describe("scoreDeck", () => {
  it("weights audience 3 and mood 2", () => {
    expect(scoreDeck(coffeeChat, answers())).toBe(5);
    expect(scoreDeck(coffeeChat, answers({ mood: "deep" }))).toBe(3);
    expect(scoreDeck(coffeeChat, answers({ audience: "group" }))).toBe(2);
  });

  it("adds one for a spicy mood when the player wants a little spice", () => {
    expect(scoreDeck(flirtyDate, answers({ spice: "a-little" }))).toBe(4);
    expect(scoreDeck(flirtyDate, answers({ spice: "none" }))).toBe(3);
  });

  it("adds two for an adult deck when the player is all in", () => {
    expect(
      scoreDeck(afterDark, answers({ audience: "partner", spice: "all-in" }))
    ).toBe(5);
  });
});

describe("rankDecks", () => {
  it("leaves adult decks out when the player wants no spice", () => {
    expect(rankedIds(answers({ audience: "partner", mood: "spicy" }))).toEqual([
      "deep-talk",
      "flirty-date",
    ]);
  });

  it("leaves adult decks out with a little spice and lifts spicy moods", () => {
    expect(rankedIds(answers({ mood: "deep", spice: "a-little" }))).toEqual([
      "flirty-date",
      "coffee-chat",
      "deep-talk",
    ]);
  });

  it("includes adult decks when the player is all in, audience matches first", () => {
    // group-heat scores 4 on mood and spice alone; deep-talk scores 3 but is for partners.
    expect(
      rankedIds(
        answers({ audience: "partner", mood: "spicy", spice: "all-in" })
      )
    ).toEqual(["after-dark", "deep-talk", "group-heat"]);
  });

  it("returns at most three decks", () => {
    const manyMatches = Array.from({ length: 6 }, (_, index) =>
      buildDeck(`match-${index}`, ["date"], ["light"])
    );
    expect(rankDecks(manyMatches, answers())).toHaveLength(3);
  });

  it("breaks ties by registry order", () => {
    const first = buildDeck("first", ["date"], ["light"]);
    const second = buildDeck("second", ["date"], ["light"]);
    const third = buildDeck("third", ["date"], ["light"]);
    expect(
      rankDecks([first, second, third], answers()).map((deck) => deck.id)
    ).toEqual(["first", "second", "third"]);
    expect(
      rankDecks([third, first, second], answers()).map((deck) => deck.id)
    ).toEqual(["third", "first", "second"]);
  });

  it("leaves out decks that match nothing", () => {
    expect(
      rankedIds(answers({ audience: "new-people", mood: "deep" }))
    ).toEqual(["deep-talk"]);
  });

  it("ranks real decks differently for a little spice than for keeping it clean", () => {
    const clean = rankDecks(
      decks,
      answers({ audience: "date", mood: "light", spice: "none" })
    ).map((deck) => deck.id);
    const spicy = rankDecks(
      decks,
      answers({ audience: "date", mood: "light", spice: "a-little" })
    ).map((deck) => deck.id);
    expect(clean).not.toEqual(spicy);
  });

  it("never suggests an adult live deck unless the player is all in", () => {
    for (const spice of ["none", "a-little"] as const) {
      const suggestions = rankDecks(
        decks,
        answers({ audience: "partner", mood: "spicy", spice })
      );
      expect(suggestions.every((deck) => !deck.isAdult)).toBe(true);
    }
  });

  describe("against the real registry", () => {
    const audiences: Audience[] = [
      "new-people",
      "friends",
      "date",
      "partner",
      "group",
    ];
    const moods: Mood[] = ["light", "deep", "playful", "spicy"];
    const spices: SpiceLevel[] = ["none", "a-little", "all-in"];
    const pinnedDays = [
      ["mid November", new Date(2026, 10, 16)],
      ["midsummer", new Date(2026, 6, 15)],
    ] as const;

    for (const [label, today] of pinnedDays) {
      it(`only suggests decks for the chosen audience when three exist (${label})`, () => {
        const visibleDecks = getVisibleDecks(today);
        for (const audience of audiences) {
          for (const mood of moods) {
            for (const spice of spices) {
              const matchingCount = visibleDecks.filter(
                (deck) =>
                  deck.audiences.includes(audience) &&
                  (spice === "all-in" || !deck.isAdult)
              ).length;
              if (matchingCount < 3) continue;
              const suggestions = rankDecks(visibleDecks, {
                audience,
                mood,
                spice,
              });
              const strays = suggestions
                .filter((deck) => !deck.audiences.includes(audience))
                .map((deck) => deck.id);
              expect(
                strays,
                `${audience} / ${mood} / ${spice} suggested ${strays.join(", ")}`
              ).toEqual([]);
            }
          }
        }
      });
    }
  });
});
