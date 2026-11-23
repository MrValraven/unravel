import { isCardType } from "../content/cardRules";
import type { CardType } from "../content/types";
import { createStore } from "./createStore";

/** The draft key of a deck that has not been saved yet. */
export const NEW_DECK_DRAFT_KEY = "new";

export interface CustomDeckDraft {
  /** The id of the deck being edited, or NEW_DECK_DRAFT_KEY. */
  deckKey: string;
  title: string;
  cards: { key: string; type: CardType; text: string }[];
  savedAt: number;
}

const isDraftCard = (raw: unknown): raw is CustomDeckDraft["cards"][number] => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.key === "string" &&
    isCardType(candidate.type) &&
    typeof candidate.text === "string"
  );
};

const isStoredDraft = (raw: unknown): raw is CustomDeckDraft | null => {
  if (raw === null) return true;
  if (typeof raw !== "object") return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.deckKey === "string" &&
    typeof candidate.title === "string" &&
    Array.isArray(candidate.cards) &&
    candidate.cards.every(isDraftCard) &&
    typeof candidate.savedAt === "number"
  );
};

/** One draft at a time: the editor's unsaved edits, kept so a reload or a stray tap loses nothing. */
const customDeckDraftStore = createStore<CustomDeckDraft | null>(
  "customDeckDraft",
  null,
  isStoredDraft
);

/** The saved draft when it belongs to this deck, otherwise undefined. */
export function loadCustomDeckDraft(
  deckKey: string
): CustomDeckDraft | undefined {
  const draft = customDeckDraftStore.get();
  return draft?.deckKey === deckKey ? draft : undefined;
}

/** Replaces any earlier draft. False when the browser blocked the write. */
export function saveCustomDeckDraft(draft: CustomDeckDraft): boolean {
  return customDeckDraftStore.set(draft);
}

export function clearCustomDeckDraft(): void {
  customDeckDraftStore.set(null);
}
