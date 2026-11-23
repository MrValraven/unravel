import { describe, expect, it } from "vitest";
import { getRandomTurn } from "./randomTurns";

const PLAYER_COUNTS = [3, 4, 5, 6, 7, 8, 9, 10];
const SEEDS = [0, 1, 42, 123456789, 2 ** 31 - 1];

describe("getRandomTurn", () => {
  it("never picks the same answerer twice in a row", () => {
    for (const seed of SEEDS) {
      for (const playerCount of PLAYER_COUNTS) {
        for (let turnIndex = 0; turnIndex <= 200; turnIndex += 1) {
          const current = getRandomTurn(seed, turnIndex, playerCount);
          const next = getRandomTurn(seed, turnIndex + 1, playerCount);
          expect(next.answererIndex).not.toBe(current.answererIndex);
        }
      }
    }
  });

  it("makes the asker the previous card's answerer", () => {
    for (const playerCount of PLAYER_COUNTS) {
      for (let turnIndex = 1; turnIndex <= 200; turnIndex += 1) {
        expect(getRandomTurn(7, turnIndex, playerCount).askerIndex).toBe(
          getRandomTurn(7, turnIndex - 1, playerCount).answererIndex
        );
      }
    }
  });

  it("never lets the asker and the answerer be the same player", () => {
    for (const playerCount of PLAYER_COUNTS) {
      for (let turnIndex = 0; turnIndex <= 200; turnIndex += 1) {
        const turn = getRandomTurn(99, turnIndex, playerCount);
        expect(turn.askerIndex).not.toBe(turn.answererIndex);
      }
    }
  });

  it("gives the same sequence for the same seed", () => {
    const readSequence = (seed: number) =>
      Array.from({ length: 60 }, (_, turnIndex) =>
        getRandomTurn(seed, turnIndex, 5)
      );
    expect(readSequence(2024)).toEqual(readSequence(2024));
    expect(readSequence(2024)).not.toEqual(readSequence(2025));
  });

  it("keeps every index inside the player count", () => {
    for (const playerCount of PLAYER_COUNTS) {
      for (let turnIndex = 0; turnIndex <= 200; turnIndex += 1) {
        const turn = getRandomTurn(31, turnIndex, playerCount);
        expect(turn.askerIndex).toBeGreaterThanOrEqual(0);
        expect(turn.askerIndex).toBeLessThan(playerCount);
        expect(turn.answererIndex).toBeGreaterThanOrEqual(0);
        expect(turn.answererIndex).toBeLessThan(playerCount);
      }
    }
  });

  it("uses every player over a long game", () => {
    for (const playerCount of PLAYER_COUNTS) {
      const answerers = new Set<number>();
      for (let turnIndex = 0; turnIndex < 300; turnIndex += 1) {
        answerers.add(getRandomTurn(5, turnIndex, playerCount).answererIndex);
      }
      expect(answerers.size).toBe(playerCount);
    }
  });
});
