import { beforeEach, describe, expect, it } from "vitest";
import {
  loadProgress,
  saveProgress,
  type PlayOptions,
} from "../../storage/progress";
import { statsStore } from "../../storage/stats";
import { buildOrder } from "./engine/buildOrder";
import {
  makeCard,
  makeDeck,
  makeOptions,
  makeSeededRandom,
} from "./engine/engine.testUtils";
import { createSession, playReducer } from "./engine/playReducer";
import {
  getTurn,
  isSessionFinished,
  sessionToProgress,
} from "./engine/selectors";
import type { PlayAction, PlaySession } from "./engine/types";
import {
  applyOptionsToSession,
  continueWithOptions,
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

/** A curated game of the test deck moved on by the given steps. */
const playSteps = (
  steps: PlayAction["type"][],
  options: PlayOptions = makeOptions(),
  playDeck = deck
): PlaySession =>
  steps.reduce(
    (session, type) => playReducer(session, { type } as PlayAction),
    createSession(playDeck, options, 100, makeSeededRandom(7))
  );

const levelOf = (cardId: string): number =>
  deck.cards.find((card) => card.id === cardId)?.level ?? 0;

describe("applyOptionsToSession", () => {
  it("keeps the place, the played cards and the turn seed, and applies new names", () => {
    const session = playSteps(["next", "next", "next"]);
    const applied = applyOptionsToSession(
      deck,
      session,
      makeOptions({ players: ["Ana", "Rui", "Eva"], isRandomTurns: true })
    );
    expect(applied.position).toBe(3);
    expect(applied.order).toEqual(session.order);
    expect(applied.turnIndex).toBe(session.turnIndex);
    expect(applied.turnSeed).toBe(session.turnSeed);
    expect(applied.firstStarterIndex).toBe(session.firstStarterIndex);
    expect(applied.startedAt).toBe(session.startedAt);
    expect(applied.options).toEqual(
      makeOptions({ players: ["Ana", "Rui", "Eva"], isRandomTurns: true })
    );
    expect(getTurn(applied, "question").kind).toBe("rotation");
  });

  it("does not change the session it is given", () => {
    const session = playSteps(["next"]);
    const before = structuredClone(session);
    applyOptionsToSession(
      deck,
      session,
      makeOptions({ startLevel: 3, isShuffled: true, players: ["Ana"] })
    );
    expect(session).toEqual(before);
  });

  it("normalizes the group options: under three names they are off, and table mode beats pass-the-phone", () => {
    const session = playSteps(["next"]);
    expect(
      applyOptionsToSession(
        deck,
        session,
        makeOptions({
          players: [" Ana ", "Rui", " "],
          isRandomTurns: true,
          isPassThePhone: true,
        })
      ).options
    ).toEqual(makeOptions({ players: ["Ana", "Rui"] }));
    expect(
      applyOptionsToSession(
        deck,
        session,
        makeOptions({
          players: ["Ana", "Rui", "Eva"],
          isTableMode: true,
          isPassThePhone: true,
        })
      ).options
    ).toMatchObject({ isTableMode: true, isPassThePhone: false });
  });

  it("keeps the order of the cards to come when neither shuffle nor start level changes", () => {
    // A skip moves the card to the end; only names change, so it stays there.
    const session = playSteps(["next", "skip"]);
    const applied = applyOptionsToSession(
      deck,
      session,
      makeOptions({ players: ["Ana", "Rui"] })
    );
    expect(applied.order).toEqual(session.order);
    expect(applied.skippedCardIds).toEqual(session.skippedCardIds);
  });

  it("rebuilds only the cards still to come for a new start level", () => {
    // Curated deck order; the current card is a-003.
    const session = playSteps(["next", "next"]);
    const applied = applyOptionsToSession(
      deck,
      session,
      makeOptions({ startLevel: 3 })
    );
    expect(applied.position).toBe(2);
    expect(applied.order).toEqual([
      "a-001",
      "a-002",
      "a-003",
      "a-006",
      "a-009",
    ]);
    expect(applied.options.startLevel).toBe(3);
  });

  it("brings back unplayed cards a lower start level adds", () => {
    const session = playSteps(["next"], makeOptions({ startLevel: 3 }));
    expect(session.order).toEqual(["a-003", "a-006", "a-009"]);
    const applied = applyOptionsToSession(
      deck,
      session,
      makeOptions({ startLevel: 1 })
    );
    expect(applied.order.slice(0, 2)).toEqual(["a-003", "a-006"]);
    expect(applied.order.slice(2)).toEqual([
      "a-001",
      "a-002",
      "a-004",
      "a-005",
      "a-007",
      "a-008",
      "a-009",
    ]);
  });

  it("shuffles the cards still to come within their levels, leaving the played ones", () => {
    const session = playSteps(["next", "next"]);
    const playedIds = session.order.slice(0, 3);
    const applied = applyOptionsToSession(
      deck,
      session,
      makeOptions({ isShuffled: true }),
      makeSeededRandom(3)
    );
    expect(applied.order.slice(0, 3)).toEqual(playedIds);
    const remainingIds = applied.order.slice(3);
    expect(remainingIds).toEqual(
      buildOrder(
        deck.cards.filter((card) => !playedIds.includes(card.id)),
        makeOptions({ isShuffled: true }),
        makeSeededRandom(3)
      )
    );
    // Levels still rise across the cards to come.
    const levels = remainingIds.map(levelOf);
    expect(levels).toEqual([...levels].sort());
    expect(applied.position).toBe(2);
    expect(applied.turnSeed).toBe(session.turnSeed);
  });

  it("keeps hidden cards out when it rebuilds the cards to come", () => {
    // a-002 is hidden ("Not tonight"); a-003 is now the current card.
    const session = playSteps(["next", "hide"]);
    expect(session.hiddenCardIds).toEqual(["a-002"]);
    const applied = applyOptionsToSession(
      deck,
      session,
      makeOptions({ isShuffled: true }),
      makeSeededRandom(5)
    );
    expect(applied.order).not.toContain("a-002");
    expect(applied.hiddenCardIds).toEqual(["a-002"]);
    expect(applied.order).toHaveLength(8);
    expect(applied.order[applied.position]).toBe("a-003");
  });

  it("keeps the current card and finishes after it when the new start level leaves no cards to come", () => {
    const smallDeck = makeDeck([
      makeCard("a-001", 1),
      makeCard("a-002", 1),
      makeCard("a-003", 1),
      makeCard("a-004", 2),
    ]);
    const session = playSteps(["next"], makeOptions(), smallDeck);
    const applied = applyOptionsToSession(
      smallDeck,
      session,
      makeOptions({ startLevel: 3 })
    );
    expect(applied.order).toEqual(["a-001", "a-002"]);
    expect(applied.position).toBe(1);
    expect(isSessionFinished(applied)).toBe(false);
    expect(isSessionFinished(playReducer(applied, { type: "next" }))).toBe(
      true
    );
  });
});

describe("continueWithOptions", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves the changed game without counting a new start", () => {
    const session = playSteps(["next", "next"]);
    saveProgress(sessionToProgress(session, 200));
    const continued = continueWithOptions(
      deck,
      session,
      makeOptions({ players: ["Ana", "Rui", "Eva"] }),
      300
    );
    expect(continued.position).toBe(2);
    expect(loadProgress()).toMatchObject({
      deckId: "a",
      position: 2,
      order: session.order,
      turnSeed: session.turnSeed,
      startedAt: session.startedAt,
      updatedAt: 300,
      options: makeOptions({ players: ["Ana", "Rui", "Eva"] }),
    });
    expect(statsStore.get().decksStarted).toEqual({});
  });
});
