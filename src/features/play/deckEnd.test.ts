import { describe, expect, it } from "vitest";
import { getBuiltinDeck } from "../../content/decks";
import { buildRecapText, pickSuggestedDeck, readDeckEndState } from "./deckEnd";
import { flowCopy } from "./flowCopy";

const options = (startLevel: 1 | 2 | 3) => ({
  isShuffled: false,
  startLevel,
  isTableMode: false,
  isRandomTurns: false,
  isPassThePhone: false,
  players: [],
});

describe("buildRecapText", () => {
  const copy = flowCopy.en.end;

  it("names the level, cards and minutes", () => {
    expect(
      buildRecapText(copy, "First Date", {
        cardsPlayed: 48,
        millisecondsPlayed: 52 * 60_000,
        options: options(3),
      })
    ).toBe("We went All in on First Date: 48 cards, 52 min.");
  });

  it("uses the warm line without options, one card and under a minute", () => {
    expect(
      buildRecapText(copy, "Unravel", {
        cardsPlayed: 1,
        millisecondsPlayed: 20_000,
      })
    ).toBe("We unravelled Unravel: 1 card, under a minute.");
  });

  it("speaks European Portuguese", () => {
    expect(
      buildRecapText(flowCopy.pt.end, "First Date", {
        cardsPlayed: 12,
        millisecondsPlayed: 10 * 60_000,
        options: options(2),
      })
    ).toBe("Fomos mais fundo em First Date: 12 cartas, 10 min.");
  });
});

describe("pickSuggestedDeck", () => {
  const firstDate = getBuiltinDeck("first-date");
  if (!firstDate) throw new Error("Missing live deck first-date");

  it("suggests another deck of the same category, never adult for a non-adult deck", () => {
    const suggestion = pickSuggestedDeck(firstDate, {});
    expect(suggestion).toBeDefined();
    expect(suggestion?.id).not.toBe("first-date");
    expect(suggestion?.category).toBe(firstDate.category);
    expect(suggestion?.isAdult).toBe(false);
  });

  it("prefers a deck finished fewer times", () => {
    const firstPick = pickSuggestedDeck(firstDate, {});
    if (!firstPick) throw new Error("No suggestion");
    const secondPick = pickSuggestedDeck(firstDate, { [firstPick.id]: 3 });
    expect(secondPick?.id).not.toBe(firstPick.id);
  });
});

describe("readDeckEndState options", () => {
  const counts = {
    cardsPlayed: 3,
    millisecondsPlayed: 1000,
    favouritesSavedCount: 0,
  };

  it("loads options saved before random turns and pass-the-phone as off", () => {
    const { isRandomTurns: _r, isPassThePhone: _p, ...oldOptions } = options(2);
    expect(
      readDeckEndState({ ...counts, options: oldOptions })?.options
    ).toEqual(options(2));
  });

  it("drops options whose new flags are not booleans", () => {
    expect(
      readDeckEndState({
        ...counts,
        options: { ...options(2), isRandomTurns: "on" },
      })?.options
    ).toBeUndefined();
  });

  it("keeps random turns from a four-name game", () => {
    const fourNames = {
      ...options(1),
      isRandomTurns: true,
      players: ["Ana", "Rui", "Eva", "Leo"],
    };
    expect(
      readDeckEndState({ ...counts, options: fourNames })?.options
    ).toEqual(fourNames);
  });
});
