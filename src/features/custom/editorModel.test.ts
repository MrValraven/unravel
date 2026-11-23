import { describe, expect, it } from "vitest";
import {
  CARD_TEXT_MAX_LENGTH,
  MAX_CARDS,
  TITLE_MAX_LENGTH,
  hasCardListChanged,
  numberCustomCards,
  readCardNumber,
} from "./deckRules";
import {
  createDraftCard,
  createEmptyDraft,
  draftFromDeck,
  draftReducer,
  draftToCustomDeck,
  isDraftChanged,
  rekeyRestoredDraft,
  validateDraft,
  type DeckDraft,
  type DraftCard,
} from "./editorModel";

const card = (
  key: string,
  text: string,
  type: DraftCard["type"] = "question"
): DraftCard => ({
  key,
  type,
  text,
});

const validDraft = (): DeckDraft => ({
  title: "Friday crew",
  cards: [
    card("a", "Best meal you ever had?"),
    card("b", "Sing a chorus", "challenge"),
  ],
});

describe("validateDraft", () => {
  it("accepts a titled deck with written cards", () => {
    expect(validateDraft(validDraft())).toEqual({
      titleProblem: undefined,
      deckProblem: undefined,
      cardProblems: {},
      isValid: true,
    });
  });

  it("flags a blank title", () => {
    const validation = validateDraft({ ...validDraft(), title: "   " });
    expect(validation.titleProblem).toBe("empty");
    expect(validation.isValid).toBe(false);
  });

  it("flags a title past the limit and accepts one at the limit", () => {
    expect(
      validateDraft({
        ...validDraft(),
        title: "x".repeat(TITLE_MAX_LENGTH + 1),
      }).titleProblem
    ).toBe("too-long");
    expect(
      validateDraft({ ...validDraft(), title: "x".repeat(TITLE_MAX_LENGTH) })
        .isValid
    ).toBe(true);
  });

  it("flags a deck with no cards", () => {
    const validation = validateDraft({ title: "Empty", cards: [] });
    expect(validation.deckProblem).toBe("no-cards");
    expect(validation.isValid).toBe(false);
  });

  it("flags a deck past the card limit", () => {
    const cards = Array.from({ length: MAX_CARDS + 1 }, (_unused, cardIndex) =>
      card(`card-${cardIndex}`, "Hi?")
    );
    expect(validateDraft({ title: "Huge", cards }).deckProblem).toBe(
      "too-many-cards"
    );
  });

  it("flags blank and overlong cards by key", () => {
    const draft: DeckDraft = {
      title: "Mixed",
      cards: [
        card("fine", "Fine card"),
        card("blank", "  "),
        card("long", "x".repeat(CARD_TEXT_MAX_LENGTH + 1)),
        card("at-limit", "x".repeat(CARD_TEXT_MAX_LENGTH)),
      ],
    };
    const validation = validateDraft(draft);
    expect(validation.cardProblems).toEqual({
      blank: "empty",
      long: "too-long",
    });
    expect(validation.isValid).toBe(false);
  });
});

describe("draftReducer", () => {
  it("adds a card at the end and stops at the card limit", () => {
    const added = draftReducer(validDraft(), {
      type: "add-card",
      card: card("c", ""),
    });
    expect(added.cards.map((entry) => entry.key)).toEqual(["a", "b", "c"]);

    const fullDraft: DeckDraft = {
      title: "Full",
      cards: Array.from({ length: MAX_CARDS }, (_unused, cardIndex) =>
        card(`k${cardIndex}`, "Hi?")
      ),
    };
    expect(
      draftReducer(fullDraft, { type: "add-card", card: card("extra", "") })
    ).toBe(fullDraft);
  });

  it("moves cards up and down and ignores moves past either end", () => {
    const draft = validDraft();
    const movedDown = draftReducer(draft, {
      type: "move-card",
      key: "a",
      direction: "down",
    });
    expect(movedDown.cards.map((entry) => entry.key)).toEqual(["b", "a"]);
    expect(
      draftReducer(draft, { type: "move-card", key: "a", direction: "up" })
    ).toBe(draft);
    expect(
      draftReducer(draft, { type: "move-card", key: "b", direction: "down" })
    ).toBe(draft);
  });

  it("edits text and type, and deletes cards", () => {
    let draft = draftReducer(validDraft(), {
      type: "set-card-text",
      key: "a",
      text: "New text",
    });
    draft = draftReducer(draft, {
      type: "set-card-type",
      key: "a",
      cardType: "everyone",
    });
    expect(draft.cards[0]).toEqual(card("a", "New text", "everyone"));
    draft = draftReducer(draft, { type: "delete-card", key: "b" });
    expect(draft.cards.map((entry) => entry.key)).toEqual(["a"]);
  });
});

describe("drafts and saved decks", () => {
  it("starts a new deck with one blank question card", () => {
    const draft = createEmptyDraft();
    expect(draft.title).toBe("");
    expect(draft.cards).toHaveLength(1);
    expect(draft.cards[0]).toMatchObject({ type: "question", text: "" });
  });

  it("gives every new draft card its own key", () => {
    expect(createDraftCard().key).not.toBe(createDraftCard().key);
  });

  it("numbers card ids in order and trims text on save", () => {
    const draft: DeckDraft = {
      title: "  Friday crew ",
      cards: [card("z", " Second? ", "challenge"), card("y", "First?")],
    };
    const deck = draftToCustomDeck(draft, {
      deckId: "custom-abc",
      createdAt: 10,
      updatedAt: 20,
    });
    expect(deck).toEqual({
      id: "custom-abc",
      title: "Friday crew",
      cards: [
        { id: "custom-abc-001", type: "challenge", text: "Second?" },
        { id: "custom-abc-002", type: "question", text: "First?" },
      ],
      createdAt: 10,
      updatedAt: 20,
    });
  });

  it("detects changes to title, text, type and order", () => {
    const deck = draftToCustomDeck(validDraft(), {
      deckId: "custom-abc",
      createdAt: 1,
      updatedAt: 1,
    });
    const initial = draftFromDeck(deck);
    expect(isDraftChanged(initial, draftFromDeck(deck))).toBe(false);
    expect(isDraftChanged(initial, { ...initial, title: "Other" })).toBe(true);
    const firstKey = initial.cards[0]?.key ?? "";
    expect(
      isDraftChanged(
        initial,
        draftReducer(initial, {
          type: "move-card",
          key: firstKey,
          direction: "down",
        })
      )
    ).toBe(true);
    expect(
      isDraftChanged(
        initial,
        draftReducer(initial, {
          type: "set-card-type",
          key: firstKey,
          cardType: "everyone",
        })
      )
    ).toBe(true);
  });
});

describe("stable card ids across edits", () => {
  const savedDeck = () =>
    draftToCustomDeck(
      {
        title: "Friday crew",
        cards: [card("a", "One?"), card("b", "Two?"), card("c", "Three?")],
      },
      { deckId: "custom-abc", createdAt: 1, updatedAt: 1 }
    );

  it("keeps the id of every kept card when cards move or change", () => {
    const deck = savedDeck();
    let draft = draftFromDeck(deck);
    draft = draftReducer(draft, {
      type: "move-card",
      key: "custom-abc-001",
      direction: "down",
    });
    draft = draftReducer(draft, {
      type: "set-card-text",
      key: "custom-abc-003",
      text: "Third?",
    });
    const edited = draftToCustomDeck(draft, {
      deckId: "custom-abc",
      createdAt: 1,
      updatedAt: 2,
    });
    expect(edited.cards).toEqual([
      { id: "custom-abc-002", type: "question", text: "Two?" },
      { id: "custom-abc-001", type: "question", text: "One?" },
      { id: "custom-abc-003", type: "question", text: "Third?" },
    ]);
  });

  it("keeps ids after a delete and numbers new cards after the highest id", () => {
    const deck = savedDeck();
    let draft = draftFromDeck(deck);
    draft = draftReducer(draft, { type: "delete-card", key: "custom-abc-001" });
    draft = draftReducer(draft, {
      type: "add-card",
      card: card("draft-card-new", "Four?"),
    });
    const edited = draftToCustomDeck(draft, {
      deckId: "custom-abc",
      createdAt: 1,
      updatedAt: 2,
    });
    expect(edited.cards.map((entry) => entry.id)).toEqual([
      "custom-abc-002",
      "custom-abc-003",
      "custom-abc-004",
    ]);
  });

  it("never gives a new card the id of a card deleted in the same edit", () => {
    const deck = savedDeck();
    let draft = draftFromDeck(deck);
    draft = draftReducer(draft, { type: "delete-card", key: "custom-abc-003" });
    draft = draftReducer(draft, {
      type: "add-card",
      card: card("draft-card-new", "Four?"),
    });
    const edited = draftToCustomDeck(draft, {
      deckId: "custom-abc",
      createdAt: 1,
      updatedAt: 2,
      previousCardIds: deck.cards.map((entry) => entry.id),
    });
    expect(edited.cards.map((entry) => entry.id)).toEqual([
      "custom-abc-001",
      "custom-abc-002",
      "custom-abc-004",
    ]);
  });

  it("renumbers keys that belong to another deck", () => {
    const cards = numberCustomCards("custom-new", [
      { key: "custom-old-007", type: "question", text: "Kept?" },
      { key: "draft-card-3", type: "challenge", text: "Fresh" },
    ]);
    expect(cards.map((entry) => entry.id)).toEqual([
      "custom-new-001",
      "custom-new-002",
    ]);
  });

  it("reads the number only from this deck's ids", () => {
    expect(readCardNumber("custom-abc", "custom-abc-012")).toBe(12);
    expect(readCardNumber("custom-abc", "custom-abcd-001")).toBeUndefined();
    expect(readCardNumber("custom-abc", "draft-card-1")).toBeUndefined();
    expect(readCardNumber("custom-abc", "custom-abc-000")).toBeUndefined();
  });

  it("reports a changed card list only when cards were added or removed", () => {
    const deck = savedDeck();
    const reordered = [...deck.cards].reverse();
    expect(hasCardListChanged(deck.cards, reordered)).toBe(false);
    expect(hasCardListChanged(deck.cards, deck.cards.slice(1))).toBe(true);
    expect(
      hasCardListChanged(deck.cards, [...deck.cards, { id: "custom-abc-004" }])
    ).toBe(true);
    expect(
      hasCardListChanged(deck.cards, [
        ...deck.cards.slice(1),
        { id: "custom-abc-004" },
      ])
    ).toBe(true);
  });
});

describe("restoring a draft", () => {
  it("replaces the whole draft", () => {
    const restored = validDraft();
    expect(
      draftReducer(createEmptyDraft(), { type: "restore", draft: restored })
    ).toBe(restored);
  });

  it("gives restored new cards fresh keys so they never collide with cards added after", () => {
    const newCard = createDraftCard();
    const restored = rekeyRestoredDraft(
      { title: "Road trip", cards: [newCard, card("custom-abc-002", "Kept")] },
      ["custom-abc-002"]
    );
    expect(restored.cards[1]?.key).toBe("custom-abc-002");
    expect(restored.cards[0]?.key).not.toBe(newCard.key);
    const added = createDraftCard();
    const keys = [...restored.cards.map((entry) => entry.key), added.key];
    expect(new Set(keys).size).toBe(keys.length);
    expect(restored.cards[0]?.text).toBe(newCard.text);
  });

  it("re-keys a repeated key so two cards never share one", () => {
    const restored = rekeyRestoredDraft(
      { title: "Twice", cards: [card("a", "One"), card("a", "Two")] },
      ["a"]
    );
    expect(restored.cards[0]?.key).toBe("a");
    expect(restored.cards[1]?.key).not.toBe("a");
  });
});
