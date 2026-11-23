import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as persistence from "./persistence";
import {
  MAX_CARDS_PER_CUSTOM_DECK,
  MAX_CUSTOM_DECKS,
  canCreateCustomDeck,
  createCustomDeckId,
  deleteCustomDeck,
  getCustomDeck,
  listCustomDecks,
  saveCustomDeck,
  useCustomDecks,
  type CustomDeck,
} from "./customDecks";

const buildDeck = (
  id: string,
  overrides: Partial<CustomDeck> = {}
): CustomDeck => ({
  id,
  title: "Friday crew",
  cards: [{ id: "c1", type: "question", text: "Favourite smell?" }],
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe("customDecks", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts empty", () => {
    expect(listCustomDecks()).toEqual([]);
    expect(getCustomDeck("custom-nothing")).toBeUndefined();
  });

  it("inserts a deck and finds it by id", () => {
    saveCustomDeck(buildDeck("custom-aaaaaaaaaa"));
    expect(getCustomDeck("custom-aaaaaaaaaa")?.title).toBe("Friday crew");
  });

  it("replaces a deck with the same id", () => {
    saveCustomDeck(buildDeck("custom-aaaaaaaaaa"));
    saveCustomDeck(buildDeck("custom-aaaaaaaaaa", { title: "Renamed" }));
    expect(listCustomDecks()).toHaveLength(1);
    expect(getCustomDeck("custom-aaaaaaaaaa")?.title).toBe("Renamed");
  });

  it("deletes a deck", () => {
    saveCustomDeck(buildDeck("custom-aaaaaaaaaa"));
    saveCustomDeck(buildDeck("custom-bbbbbbbbbb"));
    deleteCustomDeck("custom-aaaaaaaaaa");
    expect(listCustomDecks().map((deck) => deck.id)).toEqual([
      "custom-bbbbbbbbbb",
    ]);
  });

  it("caps the cards in one deck", () => {
    const cards = Array.from(
      { length: MAX_CARDS_PER_CUSTOM_DECK + 20 },
      (_unusedValue, cardIndex) => ({
        id: `c${cardIndex}`,
        type: "challenge" as const,
        text: "Do a dance",
      })
    );
    saveCustomDeck(buildDeck("custom-aaaaaaaaaa", { cards }));
    expect(getCustomDeck("custom-aaaaaaaaaa")?.cards).toHaveLength(
      MAX_CARDS_PER_CUSTOM_DECK
    );
  });

  it("ignores a new deck past the deck cap but still updates existing ones", () => {
    for (let index = 0; index < MAX_CUSTOM_DECKS; index += 1) {
      saveCustomDeck(buildDeck(`custom-${String(index).padStart(10, "0")}`));
    }
    expect(canCreateCustomDeck()).toBe(false);
    saveCustomDeck(buildDeck("custom-zzzzzzzzzz"));
    expect(listCustomDecks()).toHaveLength(MAX_CUSTOM_DECKS);
    expect(getCustomDeck("custom-zzzzzzzzzz")).toBeUndefined();
    saveCustomDeck(buildDeck("custom-0000000000", { title: "Edited" }));
    expect(getCustomDeck("custom-0000000000")?.title).toBe("Edited");
  });

  it("reports saved, deck-limit and storage-blocked", () => {
    expect(saveCustomDeck(buildDeck("custom-aaaaaaaaaa"))).toBe("saved");
    for (let index = 1; index < MAX_CUSTOM_DECKS; index += 1) {
      saveCustomDeck(buildDeck(`custom-${String(index).padStart(10, "0")}`));
    }
    expect(saveCustomDeck(buildDeck("custom-zzzzzzzzzz"))).toBe("deck-limit");
    expect(getCustomDeck("custom-zzzzzzzzzz")).toBeUndefined();
    expect(saveCustomDeck(buildDeck("custom-aaaaaaaaaa"))).toBe("saved");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(saveCustomDeck(buildDeck("custom-aaaaaaaaaa"))).toBe(
      "storage-blocked"
    );
  });

  it("asks to persist storage after a deck is saved", () => {
    const requestSpy = vi
      .spyOn(persistence, "requestPersistentStorage")
      .mockImplementation(() => {});
    saveCustomDeck(buildDeck("custom-aaaaaaaaaa"));
    expect(requestSpy).toHaveBeenCalledTimes(1);
  });

  it("does not ask to persist storage when the save was blocked", () => {
    const requestSpy = vi
      .spyOn(persistence, "requestPersistentStorage")
      .mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    saveCustomDeck(buildDeck("custom-aaaaaaaaaa"));
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it("keeps valid decks and drops only the malformed ones", () => {
    localStorage.setItem(
      "unravel:v2:customDecks",
      JSON.stringify([
        buildDeck("custom-aaaaaaaaaa"),
        { id: "nope", title: 3 },
        buildDeck("custom-bbbbbbbbbb"),
      ])
    );
    expect(listCustomDecks().map((deck) => deck.id)).toEqual([
      "custom-aaaaaaaaaa",
      "custom-bbbbbbbbbb",
    ]);
  });

  it("drops invalid cards from a deck and keeps its valid cards", () => {
    localStorage.setItem(
      "unravel:v2:customDecks",
      JSON.stringify([
        buildDeck("custom-aaaaaaaaaa", {
          cards: [
            { id: "c1", type: "question", text: "ok" },
            { id: "c2", type: "poem", text: "bad type" },
            { id: "c3", type: "everyone" },
          ] as never,
        }),
      ])
    );
    expect(
      getCustomDeck("custom-aaaaaaaaaa")?.cards.map((card) => card.id)
    ).toEqual(["c1"]);
  });

  it("keeps stored vote and hot-seat cards", () => {
    const cards = [
      { id: "c1", type: "vote", text: "Who would win a karaoke battle?" },
      { id: "c2", type: "hot-seat", text: "Ask about their worst haircut" },
    ] as const;
    localStorage.setItem(
      "unravel:v2:customDecks",
      JSON.stringify([buildDeck("custom-aaaaaaaaaa", { cards: [...cards] })])
    );
    expect(getCustomDeck("custom-aaaaaaaaaa")?.cards).toEqual(cards);
  });

  it("drops a deck whose cards were all invalid", () => {
    localStorage.setItem(
      "unravel:v2:customDecks",
      JSON.stringify([
        buildDeck("custom-aaaaaaaaaa", { cards: [{ id: 1 }] as never }),
        buildDeck("custom-bbbbbbbbbb"),
      ])
    );
    expect(listCustomDecks().map((deck) => deck.id)).toEqual([
      "custom-bbbbbbbbbb",
    ]);
  });

  it("does not wipe good decks when a new deck is saved next to a bad entry", () => {
    localStorage.setItem(
      "unravel:v2:customDecks",
      JSON.stringify([buildDeck("custom-aaaaaaaaaa"), { id: 5 }])
    );
    saveCustomDeck(buildDeck("custom-cccccccccc"));
    expect(listCustomDecks().map((deck) => deck.id)).toEqual([
      "custom-aaaaaaaaaa",
      "custom-cccccccccc",
    ]);
  });

  it("creates ids of custom- plus 10 base36 characters", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createCustomDeckId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^custom-[0-9a-z]{10}$/);
  });

  it("updates the hook consumer", () => {
    const { result } = renderHook(() => useCustomDecks());
    act(() => saveCustomDeck(buildDeck("custom-aaaaaaaaaa")));
    expect(result.current).toHaveLength(1);
  });
});
