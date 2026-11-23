import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NEW_DECK_DRAFT_KEY,
  clearCustomDeckDraft,
  loadCustomDeckDraft,
  saveCustomDeckDraft,
  type CustomDeckDraft,
} from "./customDeckDraft";

const draft: CustomDeckDraft = {
  deckKey: NEW_DECK_DRAFT_KEY,
  title: "Road trip",
  cards: [{ key: "draft-card-1", type: "question", text: "Where next?" }],
  savedAt: 1_700_000_000_000,
};

describe("custom deck draft", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearCustomDeckDraft();
    vi.restoreAllMocks();
  });

  it("is none until a draft is saved", () => {
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
  });

  it("returns the draft only for its own deck key", () => {
    expect(saveCustomDeckDraft(draft)).toBe(true);
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toEqual(draft);
    expect(loadCustomDeckDraft("custom-abc1234567")).toBeUndefined();
  });

  it("keeps one draft at a time: a newer draft replaces the older one", () => {
    saveCustomDeckDraft(draft);
    const otherDraft = { ...draft, deckKey: "custom-abc1234567" };
    saveCustomDeckDraft(otherDraft);
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
    expect(loadCustomDeckDraft("custom-abc1234567")).toEqual(otherDraft);
  });

  it("clears the draft", () => {
    saveCustomDeckDraft(draft);
    clearCustomDeckDraft();
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
    expect(
      JSON.parse(
        window.localStorage.getItem("unravel:v2:customDeckDraft") ?? "null"
      )
    ).toBeNull();
  });

  it("reads a damaged draft as none", () => {
    window.localStorage.setItem(
      "unravel:v2:customDeckDraft",
      JSON.stringify({
        ...draft,
        cards: [{ key: "a", type: "not-a-type", text: "Hi" }],
      })
    );
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
    window.localStorage.setItem("unravel:v2:customDeckDraft", "{not json");
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
  });

  it("reports false when the browser blocks the write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(saveCustomDeckDraft(draft)).toBe(false);
  });
});
