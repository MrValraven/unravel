import { describe, expect, it } from "vitest";
import { createSession } from "./engine/playReducer";
import { makeDeck, makeOptions } from "./engine/engine.testUtils";
import {
  getRevealedCards,
  markCardRevealed,
  toGameKey,
  toRevealKey,
} from "./revealedCards";

describe("revealedCards", () => {
  it("remembers a revealed card for its own game only", () => {
    const game = toGameKey(createSession(makeDeck(), makeOptions(), 1000));
    const otherGame = toGameKey(createSession(makeDeck(), makeOptions(), 2000));
    expect(game).toBe("a:1000");

    const anasCard = toRevealKey("a-001", "Ana");
    expect(getRevealedCards(game).has(anasCard)).toBe(false);
    markCardRevealed(game, "a-001", "Ana");
    markCardRevealed(game, "a-001", "Ana");
    expect([...getRevealedCards(game)]).toEqual([anasCard]);
    expect(getRevealedCards(otherGame).has(anasCard)).toBe(false);
  });

  it("keeps a card covered for another player after one player revealed it", () => {
    const game = "a:4000";
    markCardRevealed(game, "a-001", "Ana");
    expect(getRevealedCards(game).has(toRevealKey("a-001", "Ana"))).toBe(true);
    expect(getRevealedCards(game).has(toRevealKey("a-001", "Eva"))).toBe(false);
  });

  it("hands out a copy, so callers cannot reveal a card by mutating it", () => {
    const game = "a:3000";
    const revealed = getRevealedCards(game);
    (revealed as Set<string>).add(toRevealKey("a-002", "Ana"));
    expect(getRevealedCards(game).size).toBe(0);
  });
});
