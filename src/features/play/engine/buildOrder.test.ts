import { describe, expect, it } from "vitest";
import { buildOrder } from "./buildOrder";
import {
  makeCard,
  makeOptions,
  makeSeededRandom,
  mixedCards,
} from "./engine.testUtils";

const levelOf = (cardId: string): number =>
  mixedCards.find((card) => card.id === cardId)?.level ?? 0;

describe("buildOrder", () => {
  it("keeps deck order for curated play", () => {
    expect(buildOrder(mixedCards, makeOptions())).toEqual(
      mixedCards.map((card) => card.id)
    );
  });

  it("drops cards below the start level in curated play", () => {
    const order = buildOrder(mixedCards, makeOptions({ startLevel: 2 }));
    expect(order).toEqual([
      "a-001",
      "a-003",
      "a-005",
      "a-006",
      "a-008",
      "a-009",
    ]);
  });

  it("returns only level 3 cards when the start level is 3", () => {
    const order = buildOrder(mixedCards, makeOptions({ startLevel: 3 }));
    expect(order).toEqual(["a-003", "a-006", "a-009"]);
  });

  it("keeps levels ascending when shuffled", () => {
    const order = buildOrder(
      mixedCards,
      makeOptions({ isShuffled: true }),
      makeSeededRandom(7)
    );
    const levels = order.map(levelOf);
    expect(levels).toEqual([...levels].sort((first, second) => first - second));
    expect([...order].sort()).toEqual(mixedCards.map((card) => card.id).sort());
  });

  it("applies the start level when shuffled", () => {
    const order = buildOrder(
      mixedCards,
      makeOptions({ isShuffled: true, startLevel: 2 }),
      makeSeededRandom(3)
    );
    expect(order).toHaveLength(6);
    expect(order.map(levelOf).every((level) => level >= 2)).toBe(true);
  });

  it("is deterministic with the same injected random", () => {
    const options = makeOptions({ isShuffled: true });
    expect(buildOrder(mixedCards, options, makeSeededRandom(42))).toEqual(
      buildOrder(mixedCards, options, makeSeededRandom(42))
    );
  });

  it("shuffles inside a level using the injected random", () => {
    const sameLevelCards = ["x-001", "x-002", "x-003", "x-004"].map((id) =>
      makeCard(id, 1)
    );
    const alwaysZero = buildOrder(
      sameLevelCards,
      makeOptions({ isShuffled: true }),
      () => 0
    );
    expect(alwaysZero).toEqual(["x-002", "x-003", "x-004", "x-001"]);
  });

  it("does not change the input cards", () => {
    const before = mixedCards.map((card) => card.id);
    buildOrder(
      mixedCards,
      makeOptions({ isShuffled: true }),
      makeSeededRandom(1)
    );
    expect(mixedCards.map((card) => card.id)).toEqual(before);
  });

  it("returns an empty order for an empty deck", () => {
    expect(buildOrder([], makeOptions())).toEqual([]);
  });
});
