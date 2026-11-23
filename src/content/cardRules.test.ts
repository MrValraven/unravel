import { describe, expect, it } from "vitest";
import {
  MAX_TIMER_SECONDS,
  MIN_TIMER_SECONDS,
  allowsTimer,
  cardTypes,
  isCardType,
} from "./cardRules";

describe("card rules", () => {
  it("knows five card types", () =>
    expect(cardTypes).toEqual([
      "question",
      "challenge",
      "everyone",
      "vote",
      "hot-seat",
    ]));

  it("recognises only the known card types", () => {
    for (const cardType of cardTypes) {
      expect(isCardType(cardType)).toBe(true);
    }
    for (const value of ["poem", "Vote", "hot seat", "", 3, null, undefined]) {
      expect(isCardType(value)).toBe(false);
    }
  });

  it("allows timers on challenge and hot-seat only", () => {
    expect(cardTypes.filter(allowsTimer)).toEqual(["challenge", "hot-seat"]);
  });

  it("keeps timers between 30 and 120 seconds", () => {
    expect(MIN_TIMER_SECONDS).toBe(30);
    expect(MAX_TIMER_SECONDS).toBe(120);
  });
});
