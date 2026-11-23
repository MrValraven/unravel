import { describe, expect, it } from "vitest";
import type { PlayOptions } from "../../storage/progress";
import { makeDeck } from "./engine/engine.testUtils";
import { getTurn } from "./engine/selectors";
import {
  createNewSession,
  defaultPlayOptions,
  normalizePlayOptions,
  resolveStartOptions,
} from "./playSession";

const deck = makeDeck();

const withNames = (players: string[], patch: Partial<PlayOptions> = {}) => ({
  ...defaultPlayOptions,
  isRandomTurns: true,
  isPassThePhone: true,
  players,
  ...patch,
});

describe("normalizePlayOptions", () => {
  it("defaults random turns and pass-the-phone to off", () => {
    expect(defaultPlayOptions).toMatchObject({
      isRandomTurns: false,
      isPassThePhone: false,
    });
  });

  it("turns random turns and pass-the-phone off for a two-name game", () => {
    expect(normalizePlayOptions(deck, withNames(["Ana", "Rui"]))).toMatchObject(
      { isRandomTurns: false, isPassThePhone: false }
    );
  });

  it("counts names after blanks are dropped", () => {
    expect(
      normalizePlayOptions(deck, withNames(["Ana", " ", "Rui", ""]))
    ).toMatchObject({ isRandomTurns: false, isPassThePhone: false });
  });

  it("turns both off with fewer than two names too", () => {
    expect(normalizePlayOptions(deck, withNames([]))).toMatchObject({
      isRandomTurns: false,
      isPassThePhone: false,
    });
  });

  it("keeps both on with three names", () => {
    expect(
      normalizePlayOptions(deck, withNames(["Ana", "Rui", "Eva"]))
    ).toMatchObject({ isRandomTurns: true, isPassThePhone: true });
  });

  it("keeps table mode and drops pass-the-phone when a save has both on", () => {
    expect(
      normalizePlayOptions(
        deck,
        withNames(["Ana", "Rui", "Eva"], { isTableMode: true })
      )
    ).toMatchObject({
      isTableMode: true,
      isPassThePhone: false,
      isRandomTurns: true,
    });
  });

  it("trims names and keeps the other options", () => {
    expect(
      normalizePlayOptions(
        deck,
        withNames([" Ana ", "Rui", "Eva"], { isShuffled: true })
      )
    ).toEqual({
      ...defaultPlayOptions,
      isShuffled: true,
      isRandomTurns: true,
      isPassThePhone: true,
      players: ["Ana", "Rui", "Eva"],
    });
  });
});

describe("resolveStartOptions", () => {
  it("lets a quick start reuse four-name options with two names and play as a pair", () => {
    const lastFourNameGame = withNames(["Ana", "Rui", "Eva", "Leo"]);
    const twoNames = { ...lastFourNameGame, players: ["Ana", "Rui"] };
    const options = resolveStartOptions(deck, twoNames);
    expect(options).toMatchObject({
      isRandomTurns: false,
      isPassThePhone: false,
    });
    const session = createNewSession(deck, twoNames, 1);
    expect(session.options.isRandomTurns).toBe(false);
    expect(getTurn(session, "question").kind).toBe("pair");
  });

  it("keeps random turns for a quick start with three or more names", () => {
    const options = resolveStartOptions(
      deck,
      withNames(["Ana", "Rui", "Eva", "Leo"])
    );
    expect(options.isRandomTurns).toBe(true);
  });
});
