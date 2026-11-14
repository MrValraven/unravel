import type { CardType } from "../../../content/types";
import type { SavedProgress } from "../../../storage/progress";
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
  /** Exactly two named players: both answer every card, and who starts alternates. */
  | { kind: "pair"; first: string; second: string }
  /** No names, or one: everyone answers every card. */
  | { kind: "everyone-unnamed" }
  /** An everyone card: its badge already says everyone answers. */
  | { kind: "everyone" };

const ROTATION_MINIMUM_PLAYERS = 3;
const PAIR_PLAYERS = 2;

/**
 * Everyone cards: everyone. Fewer than 2 names: everyone-unnamed. Two names: a
 * pair whose first answerer swaps every card, starting from firstStarterIndex.
 * Three or more: the answerer is players[turnIndex % count] and the asker is
 * the player before them.
 */
export function getTurn(session: PlaySession, cardType: CardType): TurnInfo {
  if (cardType === "everyone") {
    return { kind: "everyone" };
  }
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
  const answerer = players[session.turnIndex % playerCount];
  const asker = players[(session.turnIndex + playerCount - 1) % playerCount];
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
    options: { ...session.options, players: [...session.options.players] },
    startedAt: session.startedAt,
    updatedAt: now,
  };
}

/**
 * `skippedCardIds` is session-only, so a restored session starts with none.
 * Games saved before `firstStarterIndex` existed start with the first player.
 */
export function progressToSession(progress: SavedProgress): PlaySession {
  return {
    deckId: progress.deckId,
    order: [...progress.order],
    position: progress.position,
    hiddenCardIds: [...progress.hiddenCardIds],
    turnIndex: progress.turnIndex,
    firstStarterIndex: progress.firstStarterIndex ?? 0,
    options: { ...progress.options, players: [...progress.options.players] },
    startedAt: progress.startedAt,
    skippedCardIds: [],
  };
}
