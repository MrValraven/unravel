import { afterEach, describe, expect, it, vi } from "vitest";
import { getBuiltinDeck } from "../../content/decks";
import { buildRecapText, pickSuggestedDeck, shareRecap } from "./deckEnd";
import { flowCopy } from "./flowCopy";

const options = (startLevel: 1 | 2 | 3) => ({
  isShuffled: false,
  startLevel,
  isTableMode: false,
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

describe("shareRecap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the share sheet when there is one", async () => {
    const share = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { share });
    expect(await shareRecap("Line", "https://example.test/")).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      text: "Line",
      url: "https://example.test/",
    });
  });

  it("reports a closed share sheet as cancelled", async () => {
    vi.stubGlobal("navigator", {
      share: () => Promise.reject(new DOMException("closed", "AbortError")),
    });
    expect(await shareRecap("Line", "https://example.test/")).toBe("cancelled");
  });

  it("copies the line and link without a share sheet", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await shareRecap("Line", "https://example.test/")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("Line https://example.test/");
  });

  it("fails when neither sharing nor the clipboard works", async () => {
    vi.stubGlobal("navigator", {});
    expect(await shareRecap("Line", "https://example.test/")).toBe("failed");
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
