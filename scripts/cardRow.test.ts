import { describe, expect, it } from "vitest";
import { parseCardRow } from "./cardRow";

const row = (
  type: string,
  timerSeconds = "",
  id = "group-night-001"
): string[] => [id, type, "1", timerSeconds, "English text", "Texto"];

describe("parseCardRow", () => {
  it("accepts vote and hot-seat rows", () => {
    expect(parseCardRow(row("vote"), "group-night", 2)).toEqual({
      card: {
        id: "group-night-001",
        type: "vote",
        level: 1,
        text: { en: "English text", pt: "Texto" },
      },
      problems: [],
    });
    expect(parseCardRow(row("hot-seat"), "group-night", 2).card?.type).toBe(
      "hot-seat"
    );
  });

  it("accepts a timer on a hot-seat row and refuses one on a vote row", () => {
    expect(parseCardRow(row("hot-seat", "60"), "group-night", 2)).toEqual({
      card: {
        id: "group-night-001",
        type: "hot-seat",
        level: 1,
        text: { en: "English text", pt: "Texto" },
        timerSeconds: 60,
      },
      problems: [],
    });
    expect(parseCardRow(row("vote", "60"), "group-night", 4)).toEqual({
      problems: [
        "line 4 (group-night-001): timerSeconds is only allowed on challenge and hot-seat cards",
      ],
    });
  });

  it("names every type in an unknown-type problem", () => {
    expect(parseCardRow(row("poem"), "group-night", 3).problems).toEqual([
      'line 3 (group-night-001): type "poem" must be one of question, challenge, everyone, vote, hot-seat',
    ]);
  });

  it("reports every problem in a row and returns no card", () => {
    const result = parseCardRow(
      ["first-date-1", "challenge", "4", "10", "", "Texto"],
      "group-night",
      7
    );
    expect(result.card).toBeUndefined();
    expect(result.problems).toEqual([
      "line 7 (first-date-1): id must look like group-night-001",
      'line 7 (first-date-1): level "4" must be 1, 2 or 3',
      'line 7 (first-date-1): timerSeconds "10" must be a whole number from 30 to 120',
      "line 7 (first-date-1): the en text is empty",
    ]);
  });

  it("refuses a row with the wrong number of columns", () => {
    expect(parseCardRow(["group-night-001", "vote"], "group-night", 5)).toEqual(
      { problems: ["line 5 (group-night-001): expected 6 columns, found 2"] }
    );
  });
});
