import { describe, expect, it } from "vitest";
import { createSession, playReducer } from "./playReducer";
import {
  getCurrentCardId,
  getProgressFraction,
  getTurn,
  isSessionFinished,
  progressToSession,
  sessionToProgress,
} from "./selectors";
import { makeCard, makeDeck, makeOptions } from "./engine.testUtils";

const fourCardDeck = makeDeck(
  ["a-001", "a-002", "a-003", "a-004"].map((id) => makeCard(id, 1))
);

/** With an unshuffled deck the only random draw is the first starter: below 0.5 picks player 1. */
const PICK_FIRST_PLAYER = () => 0;
const PICK_SECOND_PLAYER = () => 0.9;

const startSession = (
  players: string[],
  random: () => number = PICK_FIRST_PLAYER
) => createSession(fourCardDeck, makeOptions({ players }), 500, random);

const advance = (
  players: string[],
  steps: number,
  random: () => number = PICK_FIRST_PLAYER
) => {
  let session = startSession(players, random);
  for (let step = 0; step < steps; step += 1) {
    session = playReducer(session, { type: "next" });
  }
  return session;
};

describe("getTurn", () => {
  it("tells everyone to answer with 0 or 1 players", () => {
    expect(getTurn(startSession([]), "question")).toEqual({
      kind: "everyone-unnamed",
    });
    expect(getTurn(startSession([]), "challenge")).toEqual({
      kind: "everyone-unnamed",
    });
    expect(getTurn(advance(["Ana"], 2), "question")).toEqual({
      kind: "everyone-unnamed",
    });
    expect(getTurn(startSession(["Ana"]), "everyone")).toEqual({
      kind: "everyone",
    });
  });

  it("has both of 2 players answer and alternates who starts", () => {
    const players = ["Ana", "Rui"];
    expect(getTurn(advance(players, 0), "question")).toEqual({
      kind: "pair",
      first: "Ana",
      second: "Rui",
    });
    expect(getTurn(advance(players, 1), "challenge")).toEqual({
      kind: "pair",
      first: "Rui",
      second: "Ana",
    });
    expect(getTurn(advance(players, 2), "question")).toEqual({
      kind: "pair",
      first: "Ana",
      second: "Rui",
    });
  });

  it("lets the injected random pick the second player to start", () => {
    const players = ["Ana", "Rui"];
    expect(
      getTurn(advance(players, 0, PICK_SECOND_PLAYER), "question")
    ).toEqual({
      kind: "pair",
      first: "Rui",
      second: "Ana",
    });
    expect(
      getTurn(advance(players, 1, PICK_SECOND_PLAYER), "question")
    ).toEqual({
      kind: "pair",
      first: "Ana",
      second: "Rui",
    });
  });

  it("rotates through 3 players", () => {
    const players = ["Ana", "Rui", "Eva"];
    expect(getTurn(advance(players, 0), "question")).toEqual({
      kind: "rotation",
      asker: "Eva",
      answerer: "Ana",
    });
    expect(getTurn(advance(players, 1), "question")).toEqual({
      kind: "rotation",
      asker: "Ana",
      answerer: "Rui",
    });
    expect(getTurn(advance(players, 2), "question")).toEqual({
      kind: "rotation",
      asker: "Rui",
      answerer: "Eva",
    });
    expect(getTurn(advance(players, 3), "question")).toEqual({
      kind: "rotation",
      asker: "Eva",
      answerer: "Ana",
    });
  });

  it("ignores the random starter with 3 players", () => {
    expect(
      getTurn(advance(["Ana", "Rui", "Eva"], 0, PICK_SECOND_PLAYER), "question")
    ).toEqual({
      kind: "rotation",
      asker: "Eva",
      answerer: "Ana",
    });
  });

  it("returns everyone for everyone cards", () => {
    expect(getTurn(startSession(["Ana", "Rui"]), "everyone")).toEqual({
      kind: "everyone",
    });
    expect(getTurn(startSession(["Ana", "Rui", "Eva"]), "everyone")).toEqual({
      kind: "everyone",
    });
  });

  it("keeps the same player after skip and hide, and steps back on previous", () => {
    const players = ["Ana", "Rui", "Eva"];
    let session = advance(players, 1);
    session = playReducer(session, { type: "skip" });
    session = playReducer(session, { type: "hide" });
    expect(session.turnIndex).toBe(1);
    session = playReducer(session, { type: "previous" });
    expect(getTurn(session, "question")).toMatchObject({ answerer: "Ana" });
  });

  it("keeps the 2 player starter after saving and resuming", () => {
    const session = advance(["Ana", "Rui"], 1, PICK_SECOND_PLAYER);
    const resumed = progressToSession(sessionToProgress(session, 9000));
    expect(resumed.firstStarterIndex).toBe(1);
    expect(getTurn(resumed, "question")).toEqual({
      kind: "pair",
      first: "Ana",
      second: "Rui",
    });
    const nextCard = playReducer(resumed, { type: "next" });
    expect(getTurn(nextCard, "question")).toEqual({
      kind: "pair",
      first: "Rui",
      second: "Ana",
    });
  });

  it("starts with the first player when a game saved before the starter existed resumes", () => {
    const { firstStarterIndex: _droppedStarter, ...oldProgress } =
      sessionToProgress(startSession(["Ana", "Rui"], PICK_SECOND_PLAYER), 1);
    const resumed = progressToSession(oldProgress);
    expect(resumed.firstStarterIndex).toBe(0);
    expect(getTurn(resumed, "question")).toEqual({
      kind: "pair",
      first: "Ana",
      second: "Rui",
    });
  });
});

describe("session state selectors", () => {
  it("reads the current card id", () => {
    expect(getCurrentCardId(advance([], 2))).toBe("a-003");
    expect(getCurrentCardId(advance([], 4))).toBeUndefined();
  });

  it("detects a finished session", () => {
    expect(isSessionFinished(advance([], 3))).toBe(false);
    expect(isSessionFinished(advance([], 4))).toBe(true);
  });

  it("reports the progress fraction between 0 and 1", () => {
    expect(getProgressFraction(advance([], 0))).toBe(0);
    expect(getProgressFraction(advance([], 1))).toBe(0.25);
    expect(getProgressFraction(advance([], 4))).toBe(1);
  });

  it("counts an empty order as complete", () => {
    const emptySession = createSession(makeDeck([]), makeOptions(), 1);
    expect(getProgressFraction(emptySession)).toBe(1);
    expect(isSessionFinished(emptySession)).toBe(true);
  });
});

describe("progress conversion", () => {
  it("round-trips a session through saved progress", () => {
    let session = startSession(["Ana", "Rui"]);
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "hide" });
    const progress = sessionToProgress(session, 9000);
    expect(progress.updatedAt).toBe(9000);
    expect(progress.startedAt).toBe(500);
    expect(progress.hiddenCardIds).toEqual(["a-002"]);
    expect(progressToSession(progress)).toEqual({
      ...session,
      skippedCardIds: [],
    });
  });

  it("does not share arrays with the session", () => {
    const session = startSession(["Ana", "Rui"]);
    const progress = sessionToProgress(session, 1);
    progress.order.push("extra");
    progress.options.players.push("Eva");
    expect(session.order).toHaveLength(4);
    expect(session.options.players).toEqual(["Ana", "Rui"]);
  });

  it("starts a restored session with no skipped cards", () => {
    let session = startSession([]);
    session = playReducer(session, { type: "skip" });
    expect(session.skippedCardIds).toEqual(["a-001"]);
    expect(
      progressToSession(sessionToProgress(session, 1)).skippedCardIds
    ).toEqual([]);
  });
});
