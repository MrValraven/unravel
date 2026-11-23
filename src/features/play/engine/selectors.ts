import type { CardType } from "../../../content/types";
import type { SavedProgress } from "../../../storage/progress";
import { getRandomTurn } from "./randomTurns";
import type { PlaySession } from "./types";

export function getCurrentCardId(session: PlaySession): string | undefined {
  return session.order[session.position];
}

export function isSessionFinished(session: PlaySession): boolean {
  return session.position >= session.order.length;
}

/** 0..1. An empty order counts as complete. */
export function getProgressFraction(session: PlaySession): number {
  if (session.order.length === 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, session.position / session.order.length));
}

export type TurnInfo =
  /** Three or more named players: one asks, the next answers, and the roles rotate. */
  | { kind: "rotation"; asker: string; answerer: string }
  /**
   * Three or more named players with pass-the-phone on: the answerer reads the card first,
   * so the line names only them. Question and challenge cards, in rotation or random turns.
   */
  | { kind: "solo"; answerer: string }
  /** Exactly two named players: both answer every card, and who starts alternates. */
  | { kind: "pair"; first: string; second: string }
  /** No names, or one: everyone answers every card. */
  | { kind: "everyone-unnamed" }
  /** An everyone card: its badge already says everyone answers. */
  | { kind: "everyone" }
  /** A vote card: everyone points at once, whatever the names. */
  | { kind: "vote" }
  /** A hot-seat card with two or more names: the group asks this player. */
  | { kind: "hot-seat"; player: string }
  /** A hot-seat card with no names, or one: the group picks who sits in it. */
  | { kind: "hot-seat-unnamed" };

const ROTATION_MINIMUM_PLAYERS = 3;
const PAIR_PLAYERS = 2;

/**
 * Everyone cards: everyone. Vote cards: vote. Fewer than 2 names: everyone-unnamed.
 * Two names: a pair whose first answerer swaps every card, starting from
 * firstStarterIndex. Three or more: the answerer is players[turnIndex % count]
 * and the asker is the player before them; with random turns on, the answerer is
 * drawn from the saved turn seed (never the same player twice in a row) and the
 * asker is the previous card's answerer. With pass-the-phone on, a group's turn
 * drops the asker and names only the answerer (solo). A hot-seat card seats that
 * card's answerer (the pair's first player), or asks the group to pick without names.
 */
export function getTurn(session: PlaySession, cardType: CardType): TurnInfo {
  if (cardType === "everyone") {
    return { kind: "everyone" };
  }
  if (cardType === "vote") {
    return { kind: "vote" };
  }
  const turn = getAnswererTurn(session);
  if (cardType !== "hot-seat") {
    return turn.kind === "rotation" && session.options.isPassThePhone
      ? { kind: "solo", answerer: turn.answerer }
      : turn;
  }
  if (turn.kind === "pair") {
    return { kind: "hot-seat", player: turn.first };
  }
  if (turn.kind === "rotation") {
    return { kind: "hot-seat", player: turn.answerer };
  }
  return { kind: "hot-seat-unnamed" };
}

/**
 * Who the phone goes to before this card shows: the one named player of a solo or
 * hot-seat turn, when pass-the-phone is on with three or more names. Undefined for
 * everyone and vote cards, which the whole group reads at once.
 */
export function getPassThePhoneName(
  session: PlaySession,
  cardType: CardType
): string | undefined {
  const { isPassThePhone, players } = session.options;
  if (!isPassThePhone || players.length < ROTATION_MINIMUM_PLAYERS) {
    return undefined;
  }
  const turn = getTurn(session, cardType);
  if (turn.kind === "solo") return turn.answerer;
  if (turn.kind === "hot-seat") return turn.player;
  return undefined;
}

type AnswererTurn = Extract<
  TurnInfo,
  { kind: "rotation" | "pair" | "everyone-unnamed" }
>;

function getAnswererTurn(session: PlaySession): AnswererTurn {
  const { players } = session.options;
  const playerCount = players.length;
  if (playerCount === PAIR_PLAYERS) {
    const firstIndex =
      (session.firstStarterIndex + session.turnIndex) % PAIR_PLAYERS;
    const first = players[firstIndex];
    const second = players[(firstIndex + 1) % PAIR_PLAYERS];
    if (first === undefined || second === undefined) {
      return { kind: "everyone-unnamed" };
    }
    return { kind: "pair", first, second };
  }
  if (playerCount < ROTATION_MINIMUM_PLAYERS) {
    return { kind: "everyone-unnamed" };
  }
  const { askerIndex, answererIndex } = session.options.isRandomTurns
    ? getRandomTurn(session.turnSeed, session.turnIndex, playerCount)
    : {
        askerIndex: (session.turnIndex + playerCount - 1) % playerCount,
        answererIndex: session.turnIndex % playerCount,
      };
  const answerer = players[answererIndex];
  const asker = players[askerIndex];
  if (answerer === undefined || asker === undefined) {
    return { kind: "everyone-unnamed" };
  }
  return { kind: "rotation", asker, answerer };
}

export function sessionToProgress(
  session: PlaySession,
  now: number
): SavedProgress {
  return {
    deckId: session.deckId,
    order: [...session.order],
    position: session.position,
    hiddenCardIds: [...session.hiddenCardIds],
    turnIndex: session.turnIndex,
    firstStarterIndex: session.firstStarterIndex,
    turnSeed: session.turnSeed,
    options: { ...session.options, players: [...session.options.players] },
    startedAt: session.startedAt,
    updatedAt: now,
  };
}

/**
 * `skippedCardIds` is session-only, so a restored session starts with none.
 * Games saved before `firstStarterIndex` existed start with the first player, and games
 * saved before random turns have no turn seed, so they read it as 0 (and play as a rotation).
 */
export function progressToSession(progress: SavedProgress): PlaySession {
  return {
    deckId: progress.deckId,
    order: [...progress.order],
    position: progress.position,
    hiddenCardIds: [...progress.hiddenCardIds],
    turnIndex: progress.turnIndex,
    firstStarterIndex: progress.firstStarterIndex ?? 0,
    turnSeed: progress.turnSeed ?? 0,
    options: { ...progress.options, players: [...progress.options.players] },
    startedAt: progress.startedAt,
    skippedCardIds: [],
  };
}
