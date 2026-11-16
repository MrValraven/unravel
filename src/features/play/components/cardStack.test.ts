import { describe, expect, it } from "vitest";
import { getCardsBehind } from "./cardStack";

describe("getCardsBehind", () => {
  it("shows two cards underneath while plenty are left", () => {
    expect(getCardsBehind(1, 30)).toBe(2);
    expect(getCardsBehind(26, 30)).toBe(2);
  });

  it("thins to one card near the end", () => {
    expect(getCardsBehind(27, 30)).toBe(1);
    expect(getCardsBehind(29, 30)).toBe(1);
  });

  it("shows none on the last card", () => {
    expect(getCardsBehind(30, 30)).toBe(0);
    expect(getCardsBehind(1, 1)).toBe(0);
  });
});
