import { formatSeasonStart } from "./seasonLabel";

describe("formatSeasonStart", () => {
  it("formats a season start as 1 Dec", () => {
    expect(formatSeasonStart({ start: "12-01", end: "01-06" }, "en")).toBe(
      "1 Dec"
    );
  });

  it("spells the month out in Portuguese", () => {
    expect(formatSeasonStart({ start: "02-01", end: "02-14" }, "pt")).toBe(
      "1 de fevereiro"
    );
  });
});
