import type { CardType } from "../../content/types";
import type { CustomDeck } from "../../storage/customDecks";
import {
  DEFAULT_CARD_TYPE,
  MAX_CARDS,
  findCardTextProblem,
  findTitleProblem,
  numberCustomCards,
  type TextProblem,
} from "./deckRules";

/** A card while it is being edited. `key` stays stable across reorders for React and focus. */
export interface DraftCard {
  key: string;
  type: CardType;
  text: string;
}

export interface DeckDraft {
  title: string;
  cards: DraftCard[];
}

let draftCardCounter = 0;

export const createDraftCard = (): DraftCard => {
  draftCardCounter += 1;
  return {
    key: `draft-card-${draftCardCounter}`,
    type: DEFAULT_CARD_TYPE,
    text: "",
  };
};

/** A new deck opens with one blank card so the player can start typing at once. */
export const createEmptyDraft = (): DeckDraft => ({
  title: "",
  cards: [createDraftCard()],
});

export const draftFromDeck = (deck: CustomDeck): DeckDraft => ({
  title: deck.title,
  cards: deck.cards.map((card) => ({
    key: card.id,
    type: card.type,
    text: card.text,
  })),
});

export type MoveDirection = "up" | "down";

export type DraftAction =
  | { type: "set-title"; title: string }
  | { type: "add-card"; card: DraftCard }
  | { type: "set-card-text"; key: string; text: string }
  | { type: "set-card-type"; key: string; cardType: CardType }
  | { type: "move-card"; key: string; direction: MoveDirection }
  | { type: "delete-card"; key: string };

const updateCard = (
  draft: DeckDraft,
  key: string,
  patch: Partial<Omit<DraftCard, "key">>
): DeckDraft => ({
  ...draft,
  cards: draft.cards.map((card) =>
    card.key === key ? { ...card, ...patch } : card
  ),
});

const moveCard = (
  draft: DeckDraft,
  key: string,
  direction: MoveDirection
): DeckDraft => {
  const fromIndex = draft.cards.findIndex((card) => card.key === key);
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (fromIndex === -1 || toIndex < 0 || toIndex >= draft.cards.length)
    return draft;
  const reorderedCards = [...draft.cards];
  const [movedCard] = reorderedCards.splice(fromIndex, 1);
  if (!movedCard) return draft;
  reorderedCards.splice(toIndex, 0, movedCard);
  return { ...draft, cards: reorderedCards };
};

export const draftReducer = (
  draft: DeckDraft,
  action: DraftAction
): DeckDraft => {
  switch (action.type) {
    case "set-title":
      return { ...draft, title: action.title };
    case "add-card":
      return draft.cards.length >= MAX_CARDS
        ? draft
        : { ...draft, cards: [...draft.cards, action.card] };
    case "set-card-text":
      return updateCard(draft, action.key, { text: action.text });
    case "set-card-type":
      return updateCard(draft, action.key, { type: action.cardType });
    case "move-card":
      return moveCard(draft, action.key, action.direction);
    case "delete-card":
      return {
        ...draft,
        cards: draft.cards.filter((card) => card.key !== action.key),
      };
  }
};

export type DeckProblem = "no-cards" | "too-many-cards";

export interface DraftValidation {
  titleProblem?: TextProblem;
  deckProblem?: DeckProblem;
  /** Problems by card key; cards without a problem are absent. */
  cardProblems: Record<string, TextProblem>;
  isValid: boolean;
}

export const validateDraft = (draft: DeckDraft): DraftValidation => {
  const titleProblem = findTitleProblem(draft.title);
  let deckProblem: DeckProblem | undefined;
  if (draft.cards.length === 0) deckProblem = "no-cards";
  else if (draft.cards.length > MAX_CARDS) deckProblem = "too-many-cards";

  const cardProblems: Record<string, TextProblem> = {};
  for (const card of draft.cards) {
    const problem = findCardTextProblem(card.text);
    if (problem) cardProblems[card.key] = problem;
  }

  return {
    titleProblem,
    deckProblem,
    cardProblems,
    isValid:
      !titleProblem && !deckProblem && Object.keys(cardProblems).length === 0,
  };
};

const describeDraft = (draft: DeckDraft): string =>
  JSON.stringify([
    draft.title,
    draft.cards.map((card) => [card.type, card.text]),
  ]);

/** True when the title, any card text or type, or the card order differs. */
export const isDraftChanged = (
  initialDraft: DeckDraft,
  currentDraft: DeckDraft
): boolean => describeDraft(initialDraft) !== describeDraft(currentDraft);

interface SaveDetails {
  deckId: string;
  createdAt: number;
  updatedAt: number;
  /** Ids the deck had before this edit, so a new card never takes a deleted card's id. */
  previousCardIds?: readonly string[];
}

/** Turns a valid draft into the stored deck: trimmed text, kept cards keep their ids. */
export const draftToCustomDeck = (
  draft: DeckDraft,
  { deckId, createdAt, updatedAt, previousCardIds }: SaveDetails
): CustomDeck => ({
  id: deckId,
  title: draft.title.trim(),
  cards: numberCustomCards(deckId, draft.cards, previousCardIds),
  createdAt,
  updatedAt,
});
