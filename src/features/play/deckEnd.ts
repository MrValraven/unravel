import { getBuiltinDeck, getVisibleDecks } from "../../content/decks";
import type {
  Deck,
  DeckCategory,
  DeckIconName,
  DeckMeta,
  LocalizedText,
} from "../../content/types";
import { formatCopy, pluralize, type PluralForms } from "../../i18n/localize";
import type { PlayOptions } from "../../storage/progress";
import { AUDIENCE_WEIGHT, MOOD_WEIGHT } from "../finder/rankDecks";

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
  ghost: true,
  tree: true,
  snowflake: true,
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
 * How alike two decks are, with the deck finder's weights: each shared
 * audience counts like a matching "who", each shared mood like a matching mood.
 */
const scoreLikeness = (
  first: Pick<DeckMeta, "audiences" | "moods">,
  second: Pick<DeckMeta, "audiences" | "moods">
): number =>
  first.audiences.filter((audience) => second.audiences.includes(audience))
    .length *
    AUDIENCE_WEIGHT +
  first.moods.filter((mood) => second.moods.includes(mood)).length *
    MOOD_WEIGHT;

/**
 * A different deck in the same category, adult only when the current deck is
 * adult. The deck finished the fewest times wins; among those, the one most
 * like the current deck (finder weights, builtin decks only), then registry order.
 */
export const pickSuggestedDeck = (
  currentDeck: Pick<DeckMeta, "id" | "category" | "isAdult">,
  decksFinished: Record<string, number>,
  today: Date = new Date()
): Deck | undefined => {
  const currentMeta = getBuiltinDeck(currentDeck.id);
  const candidates = getVisibleDecks(today)
    .filter(
      (candidate) =>
        candidate.id !== currentDeck.id &&
        candidate.category === currentDeck.category &&
        (currentDeck.isAdult || !candidate.isAdult)
    )
    .map((candidate, registryIndex) => ({
      candidate,
      registryIndex,
      finishCount: decksFinished[candidate.id] ?? 0,
      likeness: currentMeta ? scoreLikeness(currentMeta, candidate) : 0,
    }));
  candidates.sort(
    (first, second) =>
      first.finishCount - second.finishCount ||
      second.likeness - first.likeness ||
      first.registryIndex - second.registryIndex
  );
  return candidates[0]?.candidate;
};

const MILLISECONDS_PER_MINUTE = 60_000;

export interface RecapCopy {
  recap: Record<"warm" | "deeper" | "allIn", string>;
  recapCards: PluralForms;
  recapMinutes: string;
  recapUnderAMinute: string;
}

const recapKeys = { 1: "warm", 2: "deeper", 3: "allIn" } as const;

/** One shareable line about the game: "We went All in on First Date: 48 cards, 52 min." */
export const buildRecapText = (
  copy: RecapCopy,
  deckTitle: string,
  endState: Pick<DeckEndState, "cardsPlayed" | "millisecondsPlayed" | "options">
): string => {
  const minutes = Math.round(
    endState.millisecondsPlayed / MILLISECONDS_PER_MINUTE
  );
  const startLevel = endState.options?.startLevel ?? 1;
  return formatCopy(copy.recap[recapKeys[startLevel]], {
    deck: deckTitle,
    cards: pluralize(endState.cardsPlayed, copy.recapCards),
    time:
      minutes < 1
        ? copy.recapUnderAMinute
        : formatCopy(copy.recapMinutes, { count: minutes }),
  });
};

export type RecapShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/**
 * Opens the share sheet where there is one, else copies the line and the
 * link. Closing the share sheet is not an error, so it reports "cancelled".
 */
export const shareRecap = async (
  text: string,
  url: string
): Promise<RecapShareOutcome> => {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Refused (no permission, unsupported data): the clipboard still works.
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
};
