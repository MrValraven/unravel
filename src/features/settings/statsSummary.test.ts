import { describe, expect, it } from "vitest";
import { getBuiltinDeck } from "../../content/decks";
import { emptyStats } from "../../storage/stats";
import { summarizeStats } from "./statsSummary";

describe("summarizeStats", () => {
  it("reports zeros and no play for empty stats", () => {
    expect(summarizeStats(emptyStats, getBuiltinDeck)).toEqual({
      cardsSeen: 0,
      decksFinished: 0,
      minutesPlayed: 0,
      mostPlayedDeck: undefined,
      hasAnyPlay: false,
    });
  });

  it("adds up finished decks and rounds minutes to the nearest whole minute", () => {
    const summary = summarizeStats(
      {
        decksStarted: { unravel: 3 },
        decksFinished: { unravel: 2, "first-date": 1 },
        cardsSeen: 41,
        millisecondsPlayed: 150_000,
      },
      getBuiltinDeck
    );
    expect(summary.cardsSeen).toBe(41);
    expect(summary.decksFinished).toBe(3);
    expect(summary.minutesPlayed).toBe(3);
    expect(summary.hasAnyPlay).toBe(true);
  });

  it("picks the deck started most often", () => {
    const summary = summarizeStats(
      {
        ...emptyStats,
        decksStarted: { unravel: 2, "first-date": 5, "date-night": 1 },
      },
      getBuiltinDeck
    );
    expect(summary.mostPlayedDeck?.id).toBe("first-date");
  });

  it("skips deck ids that no longer resolve", () => {
    const summary = summarizeStats(
      {
        ...emptyStats,
        decksStarted: { "custom-deleted": 9, unravel: 1 },
      },
      getBuiltinDeck
    );
    expect(summary.mostPlayedDeck?.id).toBe("unravel");
  });

  it("keeps the deck counted first on a tie", () => {
    const summary = summarizeStats(
      {
        ...emptyStats,
        decksStarted: { "date-night": 4, unravel: 4 },
      },
      getBuiltinDeck
    );
    expect(summary.mostPlayedDeck?.id).toBe("date-night");
  });
});
