import { getVisibleDecks } from "../../content/decks";
import type {
  Deck,
  DeckCategory,
  DeckIconName,
  DeckMeta,
  LocalizedText,
} from "../../content/types";
import type { PlayOptions } from "../../storage/progress";

/**
 * What the end screen needs to show a deck that can no longer be resolved:
 * a favourites game whose stars were all removed, or a custom deck deleted meanwhile.
 */
export type DeckEndSnapshot = Pick<
  DeckMeta,
  "id" | "title" | "icon" | "accent" | "category" | "isAdult"
>;

/** Router location state handed from the finished game to the end screen. */
export interface DeckEndState {
  cardsPlayed: number;
  millisecondsPlayed: number;
  favouritesSavedCount: number;
  /** The finished game's options, so "Play again" keeps the same players and level. */
  options?: PlayOptions;
  deck?: DeckEndSnapshot;
}

const knownIcons: Record<DeckIconName, true> = {
  message: true,
  coffee: true,
  heart: true,
  moon: true,
  star: true,
  sun: true,
  music: true,
  map: true,
  flame: true,
  zap: true,
  shield: true,
  feather: true,
  users: true,
  smile: true,
  gift: true,
  sparkle: true,
  calendar: true,
  bookmark: true,
  edit: true,
};

const knownCategories: Record<DeckCategory, true> = {
  friends: true,
  dating: true,
  adults: true,
};

export const toDeckEndSnapshot = (deck: Deck): DeckEndSnapshot => ({
  id: deck.id,
  title: deck.title,
  icon: deck.icon,
  accent: deck.accent,
  category: deck.category,
  isAdult: deck.isAdult,
});

const isLocalizedText = (raw: unknown): raw is LocalizedText => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return typeof candidate.en === "string" && typeof candidate.pt === "string";
};

const isDeckEndSnapshot = (raw: unknown): raw is DeckEndSnapshot => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    isLocalizedText(candidate.title) &&
    typeof candidate.icon === "string" &&
    Object.hasOwn(knownIcons, candidate.icon) &&
    typeof candidate.accent === "string" &&
    typeof candidate.category === "string" &&
    Object.hasOwn(knownCategories, candidate.category) &&
    typeof candidate.isAdult === "boolean"
  );
};

const isCount = (raw: unknown): raw is number =>
  typeof raw === "number" && Number.isFinite(raw) && raw >= 0;

const isPlayOptions = (raw: unknown): raw is PlayOptions => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.isShuffled === "boolean" &&
    (candidate.startLevel === 1 ||
      candidate.startLevel === 2 ||
      candidate.startLevel === 3) &&
    typeof candidate.isTableMode === "boolean" &&
    Array.isArray(candidate.players) &&
    candidate.players.every((name) => typeof name === "string")
  );
};

/** Location state survives in history, so it is checked before use. Missing after a refresh. */
export const readDeckEndState = (raw: unknown): DeckEndState | undefined => {
  if (typeof raw !== "object" || raw === null) return undefined;
  const candidate = raw as Record<string, unknown>;
  if (
    !isCount(candidate.cardsPlayed) ||
    !isCount(candidate.millisecondsPlayed) ||
    !isCount(candidate.favouritesSavedCount)
  ) {
    return undefined;
  }
  return {
    cardsPlayed: candidate.cardsPlayed,
    millisecondsPlayed: candidate.millisecondsPlayed,
    favouritesSavedCount: candidate.favouritesSavedCount,
    options: isPlayOptions(candidate.options) ? candidate.options : undefined,
    deck: isDeckEndSnapshot(candidate.deck) ? candidate.deck : undefined,
  };
};

/**
 * A different deck in the same category, adult only when the current deck is
 * adult. Among those, the deck finished the fewest times wins, with registry
 * order breaking ties.
 */
export const pickSuggestedDeck = (
  currentDeck: Pick<DeckMeta, "id" | "category" | "isAdult">,
  decksFinished: Record<string, number>,
  today: Date = new Date()
): Deck | undefined => {
  const candidates = getVisibleDecks(today).filter(
    (candidate) =>
      candidate.id !== currentDeck.id &&
      candidate.category === currentDeck.category &&
      (currentDeck.isAdult || !candidate.isAdult)
  );
  let suggestedDeck: Deck | undefined;
  let lowestFinishCount = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const finishCount = decksFinished[candidate.id] ?? 0;
    if (finishCount < lowestFinishCount) {
      suggestedDeck = candidate;
      lowestFinishCount = finishCount;
    }
  }
  return suggestedDeck;
};
