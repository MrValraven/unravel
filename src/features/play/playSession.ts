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
import { buildOrder } from "./engine/buildOrder";
import { createSession } from "./engine/playReducer";
import {
  getCurrentCardId,
  progressToSession,
  sessionToProgress,
} from "./engine/selectors";
import type { PlaySession } from "./engine/types";

export const defaultPlayOptions: PlayOptions = {
  isShuffled: false,
  startLevel: 1,
  isTableMode: false,
  isRandomTurns: false,
  isPassThePhone: false,
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

/** Random turns and pass-the-phone need a group: with fewer names they are off. */
const GROUP_PLAYERS_MINIMUM = 3;

/**
 * The one place options get cleaned: trims names, drops blank ones and caps the list.
 * Custom decks only have level 1 cards. Random turns and pass-the-phone turn off with
 * fewer than 3 names, so options saved from a bigger group never change a smaller game.
 * Table mode wins over pass-the-phone: it shows the card to the other side of the table.
 */
export const normalizePlayOptions = (
  deck: Deck,
  options: PlayOptions
): PlayOptions => {
  const players = options.players
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .slice(0, MAX_PLAYERS);
  const isGroup = players.length >= GROUP_PLAYERS_MINIMUM;
  return {
    ...options,
    startLevel: isCustomDeckId(deck.id) ? 1 : options.startLevel,
    isRandomTurns: isGroup && options.isRandomTurns,
    isPassThePhone: isGroup && !options.isTableMode && options.isPassThePhone,
    players,
  };
};

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
 * The lowest start level Save and continue can use without dealing cards easier
 * than the current one next: the game's own start level, or the current card's
 * level when that is lower (after the level was raised mid-game). Levels below it
 * are only for starting over.
 */
export const getLowestContinueLevel = (
  deck: Deck,
  session: PlaySession
): IntensityLevel => {
  const { startLevel } = session.options;
  const currentCardId = getCurrentCardId(session);
  const currentCard = deck.cards.find((card) => card.id === currentCardId);
  return currentCard !== undefined && currentCard.level < startLevel
    ? currentCard.level
    : startLevel;
};

/**
 * Game options saved during a game: the same game with the new options, so the
 * place, the played cards, the turn count, the turn seed and the clock stay.
 * Shuffle and start level change only the cards still to come: when either
 * changes, the cards after the current one are dealt again by the `buildOrder`
 * rules from every deck card not yet played and not hidden. If the new start
 * level leaves none, the current card is the last. A start level below
 * `getLowestContinueLevel` is raised to it, so easier cards never follow the
 * current one. `random` is injectable for tests.
 */
export const applyOptionsToSession = (
  deck: Deck,
  session: PlaySession,
  options: PlayOptions,
  random: () => number = Math.random
): PlaySession => {
  const normalizedOptions = normalizePlayOptions(deck, options);
  const lowestLevel = getLowestContinueLevel(deck, session);
  const nextOptions: PlayOptions = {
    ...normalizedOptions,
    startLevel:
      normalizedOptions.startLevel < lowestLevel
        ? lowestLevel
        : normalizedOptions.startLevel,
  };
  const isOrderChanged =
    nextOptions.isShuffled !== session.options.isShuffled ||
    nextOptions.startLevel !== session.options.startLevel;
  const base: PlaySession = {
    ...session,
    order: [...session.order],
    hiddenCardIds: [...session.hiddenCardIds],
    skippedCardIds: [...session.skippedCardIds],
    options: { ...nextOptions, players: [...nextOptions.players] },
  };
  if (!isOrderChanged) return base;
  const playedCardIds = session.order.slice(0, session.position + 1);
  const dealtCardIds = new Set([...playedCardIds, ...session.hiddenCardIds]);
  const cardsToCome = deck.cards.filter((card) => !dealtCardIds.has(card.id));
  const order = [
    ...playedCardIds,
    ...buildOrder(cardsToCome, nextOptions, random),
  ];
  const orderIds = new Set(order);
  return {
    ...base,
    order,
    skippedCardIds: base.skippedCardIds.filter((cardId) =>
      orderIds.has(cardId)
    ),
  };
};

/** Applies Game options to the running game and saves it. Not a new game, so no start is counted. */
export const continueWithOptions = (
  deck: Deck,
  session: PlaySession,
  options: PlayOptions,
  now: number
): PlaySession => {
  const nextSession = applyOptionsToSession(deck, session, options);
  saveProgress(sessionToProgress(nextSession, now));
  return nextSession;
};

/**
 * Restores saved progress against the deck as it is today. Cards removed from
 * the deck since the save drop out (from the order, the hidden and the skipped
 * cards), and the position follows the cards that were already played.
 * Undefined when nothing playable is left.
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
