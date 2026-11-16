import { describe, expect, it } from "vitest";
import { decks, getBuiltinDeck } from "../../content/decks";
import { categorySectionId, getRelatedDecks } from "./deckSummary";

const requireDeck = (deckId: string) => {
  const deck = getBuiltinDeck(deckId);
  if (!deck) throw new Error(`Missing live deck ${deckId}`);
  return deck;
};

describe("getRelatedDecks", () => {
  it("leaves out the deck itself and keeps to the limit", () => {
    const related = getRelatedDecks(requireDeck("unravel"), decks, 3);
    expect(related).toHaveLength(3);
    expect(related.map((deck) => deck.id)).not.toContain("unravel");
  });

  it("never suggests an 18+ deck from a deck for everyone", () => {
    for (const deck of decks.filter((candidate) => !candidate.isAdult)) {
      const related = getRelatedDecks(deck, decks, decks.length);
      expect(
        related.filter((candidate) => candidate.isAdult).map((d) => d.id),
        deck.id
      ).toEqual([]);
    }
  });

  it("puts decks of the same category and audience first", () => {
    const [first] = getRelatedDecks(requireDeck("first-date"), decks, 4);
    expect(first?.category).toBe("dating");
    expect(first?.audiences).toContain("date");
  });

  it("only suggests decks that share the category or an audience", () => {
    const deck = requireDeck("safe-kink");
    for (const candidate of getRelatedDecks(deck, decks, decks.length)) {
      const sharesAudience = candidate.audiences.some((audience) =>
        deck.audiences.includes(audience)
      );
      expect(
        candidate.category === deck.category || sharesAudience,
        candidate.id
      ).toBe(true);
    }
  });
});

describe("categorySectionId", () => {
  it("prefixes the category key", () => {
    expect(categorySectionId("adults")).toBe("decks-adults");
  });
});
