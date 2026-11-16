import { findCardById } from "../../content/resolveDeck";
import {
  CUSTOM_DECK_PREFIX,
  type Deck,
  type IntensityLevel,
} from "../../content/types";
import {
  MAX_PLAYERS,
  saveProgress,
  type PlayOptions,
  type SavedProgress,
} from "../../storage/progress";
import { recordDeckStart } from "../../storage/stats";
import { createSession } from "./engine/playReducer";
import { progressToSession, sessionToProgress } from "./engine/selectors";
import type { PlaySession } from "./engine/types";

export const defaultPlayOptions: PlayOptions = {
  isShuffled: false,
  startLevel: 1,
  isTableMode: false,
  players: [],
};

/** `/play/<deck>?setup=1` opens Game options; every other start goes straight into play. */
export const SETUP_SEARCH_PARAM = "setup";

export const buildPlayPath = (deckId: string): string =>
  `/play/${encodeURIComponent(deckId)}`;

/** The Game options screen for a deck. Starting from it saves the options for next time. */
export const buildGameOptionsPath = (deckId: string): string =>
  `${buildPlayPath(deckId)}?${SETUP_SEARCH_PARAM}=1`;

/** A long pause between sittings would inflate "minutes played", so one game counts at most this long. */
export const MAX_COUNTED_PLAY_MILLISECONDS = 4 * 60 * 60 * 1000;

export const isCustomDeckId = (deckId: string): boolean =>
  deckId.startsWith(CUSTOM_DECK_PREFIX);

/** Only builtin cards can be favourited: custom card ids start with the custom prefix and match no builtin card. */
export const canFavouriteCard = (cardId: string): boolean =>
  !isCustomDeckId(cardId) && findCardById(cardId) !== undefined;

export const countCardsFromLevel = (
  deck: Deck,
  startLevel: IntensityLevel
): number => deck.cards.filter((card) => card.level >= startLevel).length;

/** Trims names, drops blank ones and caps the list. Custom decks only have level 1 cards. */
export const normalizePlayOptions = (
  deck: Deck,
  options: PlayOptions
): PlayOptions => ({
  ...options,
  startLevel: isCustomDeckId(deck.id) ? 1 : options.startLevel,
  players: options.players
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .slice(0, MAX_PLAYERS),
});

/**
 * The options a start without setup uses: the last ones chosen in Game options,
 * or the defaults the first time. A start level with no cards in this deck
 * falls back to the first level, so a quick start never deals an empty game.
 */
export const resolveStartOptions = (
  deck: Deck,
  lastOptions: PlayOptions | null
): PlayOptions => {
  const options = normalizePlayOptions(deck, lastOptions ?? defaultPlayOptions);
  return countCardsFromLevel(deck, options.startLevel) > 0
    ? options
    : { ...options, startLevel: 1 };
};

/** Builds a fresh session without saving anything, so it is safe during render. */
export const createNewSession = (
  deck: Deck,
  options: PlayOptions,
  now: number
): PlaySession => createSession(deck, normalizePlayOptions(deck, options), now);

/** Counts the start and saves the session as the one saved game. Run once, outside render. */
export const commitNewSession = (
  deck: Deck,
  session: PlaySession,
  now: number
): void => {
  recordDeckStart(deck.id);
  saveProgress(sessionToProgress(session, now));
};

/** Creates a fresh session, counts the start and saves it as the one saved game. */
export const startNewSession = (
  deck: Deck,
  options: PlayOptions,
  now: number
): PlaySession => {
  const session = createNewSession(deck, options, now);
  commitNewSession(deck, session, now);
  return session;
};

/**
 * Restores saved progress against the deck as it is today. Cards removed from
 * the deck since the save drop out, and the position follows the cards that
 * were already played. Undefined when nothing playable is left.
 */
export const restoreSession = (
  deck: Deck,
  progress: SavedProgress
): PlaySession | undefined => {
  if (progress.deckId !== deck.id) return undefined;
  const deckCardIds = new Set(deck.cards.map((card) => card.id));
  const order = progress.order.filter((cardId) => deckCardIds.has(cardId));
  const position = progress.order
    .slice(0, progress.position)
    .filter((cardId) => deckCardIds.has(cardId)).length;
  if (order.length === 0 || position >= order.length) return undefined;
  return progressToSession({
    ...progress,
    order,
    position,
    hiddenCardIds: progress.hiddenCardIds.filter((cardId) =>
      deckCardIds.has(cardId)
    ),
  });
};

export const getCountedPlayMilliseconds = (
  session: PlaySession,
  now: number
): number =>
  Math.min(Math.max(now - session.startedAt, 0), MAX_COUNTED_PLAY_MILLISECONDS);
