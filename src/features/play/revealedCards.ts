import type { PlaySession } from "./engine/types";

/**
 * Pass-the-phone cards revealed in each game, for this page session only. A reveal
 * belongs to the card and the player it was passed to: Previous and an in-app resume
 * show it open for that player, while a skipped card that comes back to someone else
 * is covered again. A reload covers everything again.
 */
const revealedByGame = new Map<string, Set<string>>();

/** One game: a restart gets a new start time, so its cards are covered again. */
export const toGameKey = (session: PlaySession): string =>
  `${session.deckId}:${session.startedAt}`;

/** One card revealed by one player. Card ids never hold a newline, so the pair stays unique. */
export const toRevealKey = (cardId: string, name: string): string =>
  `${cardId}\n${name}`;

/** The reveal keys of a game, as a copy, so a caller sees a change only by reading again. */
export const getRevealedCards = (gameKey: string): ReadonlySet<string> =>
  new Set(revealedByGame.get(gameKey));

export const markCardRevealed = (
  gameKey: string,
  cardId: string,
  name: string
): void => {
  const revealed = revealedByGame.get(gameKey) ?? new Set<string>();
  revealed.add(toRevealKey(cardId, name));
  revealedByGame.set(gameKey, revealed);
};
