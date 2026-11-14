export type Locale = "en" | "pt";
export const locales: readonly Locale[] = ["en", "pt"];

export type LocalizedText = Record<Locale, string>;

export type CardType = "question" | "challenge" | "everyone";
export type IntensityLevel = 1 | 2 | 3;

export interface Card {
  /** Stable id: `<deck-id>-<3 digits>`, e.g. `first-date-007`. Never reused. */
  id: string;
  type: CardType;
  level: IntensityLevel;
  text: LocalizedText;
  /** Challenges only: optional countdown in seconds. */
  timerSeconds?: number;
}

export interface DeckPackFile {
  id: string;
  cards: Card[];
}

export type DeckCategory = "friends" | "dating" | "adults";
export type DeckTag = "" | "new" | "beta" | "seasonal";
export type Audience = "new-people" | "friends" | "date" | "partner" | "group";
export type Mood = "light" | "deep" | "playful" | "spicy";

export type DeckIconName =
  | "message"
  | "coffee"
  | "heart"
  | "moon"
  | "star"
  | "sun"
  | "music"
  | "map"
  | "flame"
  | "zap"
  | "shield"
  | "feather"
  | "users"
  | "smile"
  | "gift"
  | "sparkle"
  | "calendar"
  | "bookmark"
  | "edit";

export interface SeasonWindow {
  /** Inclusive, "MM-DD". A window may wrap the year end (e.g. "12-15" to "01-07"). */
  start: string;
  end: string;
}

export interface DeckMeta {
  /** Kebab-case slug used in URLs: /decks/first-date, /play/first-date */
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  category: DeckCategory;
  tag: DeckTag;
  isAdult: boolean;
  icon: DeckIconName;
  /** Hex colour used for the deck's accent band, icon and share image. */
  accent: string;
  audiences: Audience[];
  moods: Mood[];
  season?: SeasonWindow;
}

export interface Deck extends DeckMeta {
  cards: Card[];
}

export const FAVOURITES_DECK_ID = "favourites";
export const CUSTOM_DECK_PREFIX = "custom-";
