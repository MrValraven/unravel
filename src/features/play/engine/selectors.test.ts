import { describe, expect, it } from "vitest";
import { createSession, playReducer } from "./playReducer";
import {
  getCurrentCardId,
  getPassThePhoneName,
  getProgressFraction,
  getTurn,
  isSessionFinished,
  progressToSession,
  sessionToProgress,
} from "./selectors";
import {
  makeCard,
  makeDeck,
  makeOptions,
  makeSeededRandom,
} from "./engine.testUtils";
import { getRandomTurn } from "./randomTurns";

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

  it.each([[[]], [["Ana"]], [["Ana", "Rui"]], [["Ana", "Rui", "Eva"]]])(
    "lets everyone vote with %j",
    (players: string[]) => {
      expect(getTurn(advance(players, 1), "vote")).toEqual({ kind: "vote" });
    }
  );

  it("asks the group to pick someone for the hot seat with fewer than two names", () => {
    expect(getTurn(startSession([]), "hot-seat")).toEqual({
      kind: "hot-seat-unnamed",
    });
    expect(getTurn(advance(["Ana"], 2), "hot-seat")).toEqual({
      kind: "hot-seat-unnamed",
    });
  });

  it("seats the first of a pair, and the answerer of a rotation", () => {
    const pair = ["Ana", "Rui"];
    expect(getTurn(advance(pair, 0), "hot-seat")).toEqual({
      kind: "hot-seat",
      player: "Ana",
    });
    expect(getTurn(advance(pair, 1), "hot-seat")).toEqual({
      kind: "hot-seat",
      player: "Rui",
    });
    expect(getTurn(advance(pair, 0, PICK_SECOND_PLAYER), "hot-seat")).toEqual({
      kind: "hot-seat",
      player: "Rui",
    });
    const group = ["Ana", "Rui", "Eva"];
    expect(getTurn(advance(group, 0), "hot-seat")).toEqual({
      kind: "hot-seat",
      player: "Ana",
    });
    expect(getTurn(advance(group, 2), "hot-seat")).toEqual({
      kind: "hot-seat",
      player: "Eva",
    });
    expect(getTurn(advance(group, 3), "hot-seat")).toEqual({
      kind: "hot-seat",
      player: "Ana",
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

describe("getTurn with random turns", () => {
  const group = ["Ana", "Rui", "Eva", "Leo"];
  const startRandomSession = (players: string[] = group) =>
    createSession(
      makeDeck(),
      makeOptions({ players, isRandomTurns: true }),
      500,
      makeSeededRandom(77)
    );

  const answererAt = (session: ReturnType<typeof startRandomSession>) => {
    const turn = getTurn(session, "question");
    if (turn.kind !== "rotation")
      throw new Error(`Expected rotation: ${turn.kind}`);
    return turn;
  };

  it("draws a turn seed after the order and the first starter", () => {
    const session = startRandomSession();
    expect(Number.isInteger(session.turnSeed)).toBe(true);
    expect(session.turnSeed).toBeGreaterThanOrEqual(0);
    expect(session.turnSeed).toBeLessThan(2 ** 31);
  });

  it("picks the answerer from the seed and shows the previous answerer as the asker", () => {
    const session = startRandomSession();
    const { askerIndex, answererIndex } = getRandomTurn(
      session.turnSeed,
      0,
      group.length
    );
    expect(getTurn(session, "question")).toEqual({
      kind: "rotation",
      asker: group[askerIndex],
      answerer: group[answererIndex],
    });
    const next = playReducer(session, { type: "next" });
    expect(answererAt(next).asker).toBe(answererAt(session).answerer);
  });

  it("never repeats the answerer on consecutive cards", () => {
    let session = startRandomSession();
    let previousAnswerer = answererAt(session).answerer;
    for (let step = 0; step < 3; step += 1) {
      session = playReducer(session, { type: "next" });
      const { answerer } = answererAt(session);
      expect(answerer).not.toBe(previousAnswerer);
      previousAnswerer = answerer;
    }
  });

  it("applies to challenge cards and seats the random answerer on hot-seat cards", () => {
    const session = playReducer(startRandomSession(), { type: "next" });
    const { answerer } = answererAt(session);
    expect(getTurn(session, "challenge")).toMatchObject({
      kind: "rotation",
      answerer,
    });
    expect(getTurn(session, "hot-seat")).toEqual({
      kind: "hot-seat",
      player: answerer,
    });
  });

  it("still shows everyone and vote cards as before", () => {
    const session = startRandomSession();
    expect(getTurn(session, "everyone")).toEqual({ kind: "everyone" });
    expect(getTurn(session, "vote")).toEqual({ kind: "vote" });
  });

  it("keeps the random answerer after Previous, save and restore", () => {
    let session = startRandomSession();
    const answerers: string[] = [answererAt(session).answerer];
    const askers: string[] = [answererAt(session).asker];
    for (let step = 0; step < 5; step += 1) {
      session = playReducer(session, { type: "next" });
      answerers.push(answererAt(session).answerer);
      askers.push(answererAt(session).asker);
    }
    session = playReducer(session, { type: "previous" });
    expect(answererAt(session).answerer).toBe(answerers[4]);
    expect(answererAt(session).asker).toBe(askers[4]);

    const restored = progressToSession(sessionToProgress(session, 9000));
    expect(restored.turnSeed).toBe(session.turnSeed);
    expect(answererAt(restored)).toEqual(answererAt(session));
    const afterRestore = playReducer(restored, { type: "next" });
    expect(answererAt(afterRestore).answerer).toBe(answerers[5]);
  });

  it("plays a game saved before random turns as a rotation", () => {
    const { turnSeed: _droppedSeed, ...oldProgress } = sessionToProgress(
      createSession(
        fourCardDeck,
        makeOptions({ players: group }),
        500,
        PICK_FIRST_PLAYER
      ),
      1
    );
    const {
      isRandomTurns: _r,
      isPassThePhone: _p,
      ...oldOptions
    } = oldProgress.options;
    const resumed = progressToSession({
      ...oldProgress,
      options: oldOptions as typeof oldProgress.options,
    });
    expect(resumed.turnSeed).toBe(0);
    expect(getTurn(resumed, "question")).toEqual({
      kind: "rotation",
      asker: "Leo",
      answerer: "Ana",
    });
    const next = playReducer(resumed, { type: "next" });
    expect(getTurn(next, "question")).toEqual({
      kind: "rotation",
      asker: "Ana",
      answerer: "Rui",
    });
  });

  it("plays a pair exactly as before when random turns is on with two names", () => {
    const session = startRandomSession(["Ana", "Rui"]);
    expect(getTurn(session, "question")).toEqual({
      kind: "pair",
      first: "Ana",
      second: "Rui",
    });
  });

  it("keeps the saved turn seed", () => {
    const session = startRandomSession();
    expect(sessionToProgress(session, 1).turnSeed).toBe(session.turnSeed);
  });
});

describe("getTurn with pass-the-phone", () => {
  const group = ["Ana", "Rui", "Eva"];
  const startPassSession = (
    players: string[] = group,
    patch: { isRandomTurns?: boolean } = {}
  ) =>
    createSession(
      makeDeck(),
      makeOptions({ players, isPassThePhone: true, ...patch }),
      500,
      makeSeededRandom(77)
    );

  it("drops the asker and names only the answerer with pass-the-phone", () => {
    const session = startPassSession();
    expect(getTurn(session, "question")).toEqual({
      kind: "solo",
      answerer: "Ana",
    });
    expect(getTurn(session, "challenge")).toEqual({
      kind: "solo",
      answerer: "Ana",
    });
    expect(getTurn(session, "hot-seat")).toEqual({
      kind: "hot-seat",
      player: "Ana",
    });

    const random = startPassSession(group, { isRandomTurns: true });
    const { answererIndex } = getRandomTurn(random.turnSeed, 0, group.length);
    expect(getTurn(random, "question")).toEqual({
      kind: "solo",
      answerer: group[answererIndex],
    });
  });

  it("asks to pass the phone on question, challenge and hot-seat cards only", () => {
    const session = playReducer(startPassSession(), { type: "next" });
    expect(getPassThePhoneName(session, "question")).toBe("Rui");
    expect(getPassThePhoneName(session, "challenge")).toBe("Rui");
    expect(getPassThePhoneName(session, "hot-seat")).toBe("Rui");
    expect(getPassThePhoneName(session, "vote")).toBeUndefined();
    expect(getPassThePhoneName(session, "everyone")).toBeUndefined();

    const pair = startPassSession(["Ana", "Rui"]);
    expect(getTurn(pair, "question").kind).toBe("pair");
    expect(getPassThePhoneName(pair, "question")).toBeUndefined();
    expect(getPassThePhoneName(pair, "hot-seat")).toBeUndefined();

    const switchedOff = createSession(
      makeDeck(),
      makeOptions({ players: group }),
      500
    );
    expect(getPassThePhoneName(switchedOff, "question")).toBeUndefined();
    expect(getPassThePhoneName(switchedOff, "hot-seat")).toBeUndefined();
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
