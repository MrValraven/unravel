import type { Deck } from "../../../content/types";
import type { PlayOptions } from "../../../storage/progress";
import { buildOrder } from "./buildOrder";
import type { PlayAction, PlaySession } from "./types";

/** 0 or 1, so either of two named players can start the game. */
const pickFirstStarterIndex = (random: () => number): number =>
  Math.min(1, Math.max(0, Math.floor(random() * 2)));

export function createSession(
  deck: Deck,
  options: PlayOptions,
  now: number,
  random: () => number = Math.random
): PlaySession {
  // The order draws from `random` first, so a seeded order stays the same as before.
  const order = buildOrder(deck.cards, options, random);
  return {
    deckId: deck.id,
    order,
    position: 0,
    hiddenCardIds: [],
    turnIndex: 0,
    firstStarterIndex: pickFirstStarterIndex(random),
    options: { ...options, players: [...options.players] },
    startedAt: now,
    skippedCardIds: [],
  };
}

const removeItemAt = <Item>(items: Item[], itemIndex: number): Item[] => [
  ...items.slice(0, itemIndex),
  ...items.slice(itemIndex + 1),
];

const assertUnreachable = (action: never): never => {
  throw new Error(`Unknown play action: ${JSON.stringify(action)}`);
};

const removeCurrentCard = (session: PlaySession): PlaySession => {
  const currentCardId = session.order[session.position];
  if (currentCardId === undefined) {
    return session;
  }
  return {
    ...session,
    order: removeItemAt(session.order, session.position),
    hiddenCardIds: [...session.hiddenCardIds, currentCardId],
    skippedCardIds: session.skippedCardIds.filter(
      (skippedCardId) => skippedCardId !== currentCardId
    ),
  };
};

const skipCurrentCard = (session: PlaySession): PlaySession => {
  const currentCardId = session.order[session.position];
  if (currentCardId === undefined) {
    return session;
  }
  // A card skipped before, or the last card in the order, is hidden instead:
  // moving the last card to the end would leave the same card on screen.
  const isLastCard = session.position === session.order.length - 1;
  if (isLastCard || session.skippedCardIds.includes(currentCardId)) {
    return removeCurrentCard(session);
  }
  return {
    ...session,
    order: [...removeItemAt(session.order, session.position), currentCardId],
    skippedCardIds: [...session.skippedCardIds, currentCardId],
  };
};

export function playReducer(
  session: PlaySession,
  action: PlayAction
): PlaySession {
  switch (action.type) {
    case "next":
      if (session.position >= session.order.length) {
        return session;
      }
      return {
        ...session,
        position: session.position + 1,
        turnIndex: session.turnIndex + 1,
      };
    case "previous":
      if (session.position <= 0) {
        return session;
      }
      return {
        ...session,
        position: session.position - 1,
        turnIndex: Math.max(0, session.turnIndex - 1),
      };
    case "skip":
      return skipCurrentCard(session);
    case "hide":
    case "pass":
      return removeCurrentCard(session);
    case "restart":
      return {
        ...session,
        order: [...action.order],
        position: 0,
        hiddenCardIds: [],
        turnIndex: 0,
        skippedCardIds: [],
      };
    default:
      return assertUnreachable(action);
  }
}
