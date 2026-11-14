import { describe, expect, it } from "vitest";
import { createSession, playReducer } from "./playReducer";
import { getCurrentCardId, isSessionFinished } from "./selectors";
import {
  makeDeck,
  makeOptions,
  makeSeededRandom,
  makeCard,
} from "./engine.testUtils";

const threeCardDeck = makeDeck([
  makeCard("a-001", 1),
  makeCard("a-002", 1),
  makeCard("a-003", 1),
]);

const startThreeCardSession = (players: string[] = []) =>
  createSession(threeCardDeck, makeOptions({ players }), 1000);

describe("createSession", () => {
  it("starts at position 0 with an empty history", () => {
    const session = startThreeCardSession(["Ana", "Rui"]);
    expect(session).toMatchObject({
      deckId: "a",
      order: ["a-001", "a-002", "a-003"],
      position: 0,
      hiddenCardIds: [],
      skippedCardIds: [],
      turnIndex: 0,
      startedAt: 1000,
    });
  });

  it("uses the injected random for a shuffled order", () => {
    const options = makeOptions({ isShuffled: true });
    const first = createSession(makeDeck(), options, 1, makeSeededRandom(9));
    const second = createSession(makeDeck(), options, 1, makeSeededRandom(9));
    expect(first.order).toEqual(second.order);
  });

  it("picks the first of two starters from the injected random", () => {
    const options = makeOptions({ players: ["Ana", "Rui"] });
    expect(
      createSession(threeCardDeck, options, 1, () => 0).firstStarterIndex
    ).toBe(0);
    expect(
      createSession(threeCardDeck, options, 1, () => 0.49).firstStarterIndex
    ).toBe(0);
    expect(
      createSession(threeCardDeck, options, 1, () => 0.5).firstStarterIndex
    ).toBe(1);
    expect(
      createSession(threeCardDeck, options, 1, () => 0.999).firstStarterIndex
    ).toBe(1);
  });

  it("keeps a seeded shuffled order the same when it also picks a starter", () => {
    const options = makeOptions({ isShuffled: true, players: ["Ana", "Rui"] });
    const session = createSession(makeDeck(), options, 1, makeSeededRandom(9));
    const unnamedSession = createSession(
      makeDeck(),
      makeOptions({ isShuffled: true }),
      1,
      makeSeededRandom(9)
    );
    expect(session.order).toEqual(unnamedSession.order);
  });

  it("copies the player list", () => {
    const players = ["Ana", "Rui"];
    const session = createSession(threeCardDeck, makeOptions({ players }), 1);
    players.push("Eva");
    expect(session.options.players).toEqual(["Ana", "Rui"]);
  });
});

describe("playReducer next and previous", () => {
  it("moves forward and advances the turn", () => {
    const session = playReducer(startThreeCardSession(), { type: "next" });
    expect(session.position).toBe(1);
    expect(session.turnIndex).toBe(1);
  });

  it("stops at the end of the order", () => {
    let session = startThreeCardSession();
    for (let step = 0; step < 5; step += 1) {
      session = playReducer(session, { type: "next" });
    }
    expect(session.position).toBe(3);
    expect(session.turnIndex).toBe(3);
    expect(isSessionFinished(session)).toBe(true);
  });

  it("stays at 0 when going back from the first card", () => {
    const session = playReducer(startThreeCardSession(), { type: "previous" });
    expect(session.position).toBe(0);
    expect(session.turnIndex).toBe(0);
  });

  it("steps back and rewinds the turn", () => {
    let session = startThreeCardSession();
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "previous" });
    expect(session.position).toBe(1);
    expect(session.turnIndex).toBe(1);
  });
});

describe("playReducer previous from a finished session", () => {
  it("steps back to the last card and rewinds the turn", () => {
    let session = startThreeCardSession(["Ana", "Rui"]);
    for (let step = 0; step < 3; step += 1) {
      session = playReducer(session, { type: "next" });
    }
    expect(isSessionFinished(session)).toBe(true);
    session = playReducer(session, { type: "previous" });
    expect(session.position).toBe(2);
    expect(session.turnIndex).toBe(2);
    expect(getCurrentCardId(session)).toBe("a-003");
    expect(isSessionFinished(session)).toBe(false);
  });
});

describe("playReducer skip", () => {
  it("moves the current card to the end and shows the next card", () => {
    const session = playReducer(startThreeCardSession(), { type: "skip" });
    expect(session.order).toEqual(["a-002", "a-003", "a-001"]);
    expect(session.position).toBe(0);
    expect(getCurrentCardId(session)).toBe("a-002");
    expect(session.skippedCardIds).toEqual(["a-001"]);
    expect(session.hiddenCardIds).toEqual([]);
  });

  it("keeps the turn unchanged", () => {
    const session = playReducer(startThreeCardSession(["Ana", "Rui"]), {
      type: "skip",
    });
    expect(session.turnIndex).toBe(0);
  });

  it("hides a card that was already skipped once", () => {
    let session = startThreeCardSession();
    session = playReducer(session, { type: "skip" });
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "next" });
    expect(getCurrentCardId(session)).toBe("a-001");
    session = playReducer(session, { type: "skip" });
    expect(session.order).toEqual(["a-002", "a-003"]);
    expect(session.hiddenCardIds).toEqual(["a-001"]);
    expect(session.skippedCardIds).toEqual([]);
  });

  it("hides the last card on its first skip so the deck ends", () => {
    let session = startThreeCardSession();
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "skip" });
    expect(session.order).toEqual(["a-001", "a-002"]);
    expect(session.hiddenCardIds).toEqual(["a-003"]);
    expect(session.skippedCardIds).toEqual([]);
    expect(isSessionFinished(session)).toBe(true);
  });

  it("hides the last card when it was already skipped once", () => {
    let session = startThreeCardSession();
    session = playReducer(session, { type: "skip" });
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "next" });
    expect(getCurrentCardId(session)).toBe("a-001");
    session = playReducer(session, { type: "skip" });
    expect(session.hiddenCardIds).toEqual(["a-001"]);
    expect(isSessionFinished(session)).toBe(true);
  });

  it("finishes a one card deck on the first skip", () => {
    const session = playReducer(
      createSession(makeDeck([makeCard("a-001", 1)]), makeOptions(), 1),
      { type: "skip" }
    );
    expect(session.order).toEqual([]);
    expect(isSessionFinished(session)).toBe(true);
  });
});

describe("playReducer hide and pass", () => {
  it.each(["hide", "pass"] as const)("%s removes the current card", (type) => {
    const session = playReducer(startThreeCardSession(), { type });
    expect(session.order).toEqual(["a-002", "a-003"]);
    expect(session.position).toBe(0);
    expect(session.hiddenCardIds).toEqual(["a-001"]);
    expect(getCurrentCardId(session)).toBe("a-002");
  });

  it("keeps the turn unchanged", () => {
    let session = startThreeCardSession(["Ana", "Rui"]);
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "hide" });
    expect(session.turnIndex).toBe(1);
  });

  it("finishes when the last card is hidden", () => {
    let session = startThreeCardSession();
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "pass" });
    expect(isSessionFinished(session)).toBe(true);
    expect(session.hiddenCardIds).toEqual(["a-003"]);
  });

  it("does nothing once the session is finished", () => {
    let session = startThreeCardSession();
    for (let step = 0; step < 3; step += 1) {
      session = playReducer(session, { type: "hide" });
    }
    const finished = playReducer(session, { type: "hide" });
    expect(finished).toBe(session);
    expect(playReducer(session, { type: "skip" })).toBe(session);
  });
});

describe("playReducer restart", () => {
  it("resets progress with the new order and keeps options and start time", () => {
    let session = startThreeCardSession(["Ana", "Rui"]);
    session = playReducer(session, { type: "next" });
    session = playReducer(session, { type: "skip" });
    session = playReducer(session, { type: "hide" });
    const restarted = playReducer(session, {
      type: "restart",
      order: ["a-003", "a-002", "a-001"],
    });
    expect(restarted).toEqual({
      deckId: "a",
      order: ["a-003", "a-002", "a-001"],
      position: 0,
      hiddenCardIds: [],
      skippedCardIds: [],
      turnIndex: 0,
      firstStarterIndex: session.firstStarterIndex,
      options: session.options,
      startedAt: 1000,
    });
  });
});
