import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Card, Deck } from "../content/types";
import { isAgeConfirmed } from "./ageGate";
import { settingsStore, updateSettings } from "./settings";
import {
  clearProgress,
  loadProgress,
  migrateLegacyStorage,
  saveProgress,
  useProgress,
  type SavedProgress,
} from "./progress";

const buildProgress = (
  overrides: Partial<SavedProgress> = {}
): SavedProgress => ({
  deckId: "first-date",
  order: ["first-date-001", "first-date-002", "first-date-003"],
  position: 1,
  hiddenCardIds: [],
  turnIndex: 0,
  options: {
    isShuffled: false,
    startLevel: 1,
    isTableMode: false,
    isRandomTurns: false,
    isPassThePhone: false,
    players: [],
  },
  startedAt: 1000,
  updatedAt: 2000,
  ...overrides,
});

const buildCard = (id: string): Card => ({
  id,
  type: "question",
  level: 1,
  text: { en: id, pt: id },
});

const buildDeck = (
  id: string,
  titleEnglish: string,
  cardCount: number
): Deck => ({
  id,
  title: { en: titleEnglish, pt: titleEnglish },
  description: { en: "", pt: "" },
  category: "dating",
  tag: "",
  isAdult: false,
  icon: "heart",
  accent: "#eebbc3",
  audiences: ["date"],
  moods: ["light"],
  cards: Array.from({ length: cardCount }, (_unusedValue, cardIndex) =>
    buildCard(`${id}-${String(cardIndex + 1).padStart(3, "0")}`)
  ),
});

describe("progress", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing is saved", () => {
    expect(loadProgress()).toBeNull();
  });

  it("round-trips a mid-play session", () => {
    const progress = buildProgress();
    saveProgress(progress);
    expect(loadProgress()).toEqual(progress);
  });

  it("keeps the two player starter", () => {
    const progress = buildProgress({ firstStarterIndex: 1 });
    saveProgress(progress);
    expect(loadProgress()?.firstStarterIndex).toBe(1);
  });

  it("loads a game saved before the starter existed", () => {
    const progress = buildProgress();
    expect(progress).not.toHaveProperty("firstStarterIndex");
    localStorage.setItem("unravel:v2:progress", JSON.stringify(progress));
    expect(loadProgress()).toEqual(progress);
  });

  it("returns null when the stored starter is invalid", () => {
    localStorage.setItem(
      "unravel:v2:progress",
      JSON.stringify(buildProgress({ firstStarterIndex: -1 }))
    );
    expect(loadProgress()).toBeNull();
  });

  it("treats a session past the last card as finished", () => {
    saveProgress(buildProgress({ position: 3 }));
    expect(loadProgress()).toBeNull();
  });

  it("treats an empty order as no session", () => {
    saveProgress(buildProgress({ order: [], position: 0 }));
    expect(loadProgress()).toBeNull();
  });

  it("returns null for stored data with the wrong shape", () => {
    localStorage.setItem("unravel:v2:progress", JSON.stringify({ deckId: 4 }));
    expect(loadProgress()).toBeNull();
  });

  it("returns null when the stored options are invalid", () => {
    localStorage.setItem(
      "unravel:v2:progress",
      JSON.stringify({ ...buildProgress(), options: { startLevel: 5 } })
    );
    expect(loadProgress()).toBeNull();
  });

  it("loads options saved before random turns and pass-the-phone as off", () => {
    const {
      isRandomTurns: _r,
      isPassThePhone: _p,
      ...oldOptions
    } = buildProgress().options;
    localStorage.setItem(
      "unravel:v2:progress",
      JSON.stringify({ ...buildProgress(), options: oldOptions })
    );
    expect(loadProgress()?.options).toEqual(buildProgress().options);
  });

  it("rejects options whose new flags are not booleans", () => {
    for (const flags of [
      { isRandomTurns: "yes" },
      { isPassThePhone: 1 },
      { isRandomTurns: null },
    ]) {
      localStorage.setItem(
        "unravel:v2:progress",
        JSON.stringify({
          ...buildProgress(),
          options: { ...buildProgress().options, ...flags },
        })
      );
      expect(loadProgress()).toBeNull();
    }
  });

  it("rejects options with more than ten players", () => {
    localStorage.setItem(
      "unravel:v2:progress",
      JSON.stringify(
        buildProgress({
          options: {
            ...buildProgress().options,
            players: Array.from({ length: 11 }, (_, index) => `P${index}`),
          },
        })
      )
    );
    expect(loadProgress()).toBeNull();
  });

  it("keeps a saved turn seed", () => {
    saveProgress(buildProgress({ turnSeed: 123456 }));
    expect(loadProgress()?.turnSeed).toBe(123456);
  });

  it("loads a game saved before the turn seed existed without one", () => {
    saveProgress(buildProgress());
    expect(loadProgress()).not.toHaveProperty("turnSeed");
  });

  it("returns null when the stored turn seed is invalid", () => {
    for (const turnSeed of [-1, 1.5, "7"]) {
      localStorage.setItem(
        "unravel:v2:progress",
        JSON.stringify({ ...buildProgress(), turnSeed })
      );
      expect(loadProgress()).toBeNull();
    }
  });

  it("clears progress", () => {
    saveProgress(buildProgress());
    clearProgress();
    expect(loadProgress()).toBeNull();
  });

  it("updates the hook consumer and hides finished sessions", () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current).toBeNull();
    act(() => saveProgress(buildProgress()));
    expect(result.current?.position).toBe(1);
    act(() => saveProgress(buildProgress({ position: 3 })));
    expect(result.current).toBeNull();
  });
});

describe("migrateLegacyStorage", () => {
  const decks = [
    buildDeck("first-date", "First Date", 10),
    buildDeck("date-night", "Date Night Renamed", 4),
  ];

  beforeEach(() => localStorage.clear());

  const setLegacyProgress = (savedCounter: number, savedTitle: string) =>
    localStorage.setItem(
      "gameProgress",
      JSON.stringify({ savedMode: ["a", "b"], savedCounter, savedTitle })
    );

  it("does nothing when no v1 keys exist", () => {
    migrateLegacyStorage(decks);
    expect(loadProgress()).toBeNull();
    expect(isAgeConfirmed()).toBe(false);
  });

  it("maps a v1 session to the deck with the matching English title", () => {
    setLegacyProgress(3, "first date");
    migrateLegacyStorage(decks);
    const progress = loadProgress();
    expect(progress?.deckId).toBe("first-date");
    expect(progress?.position).toBe(3);
    expect(progress?.order).toHaveLength(10);
    expect(progress?.order[0]).toBe("first-date-001");
    expect(progress?.hiddenCardIds).toEqual([]);
    expect(progress?.options).toEqual({
      isShuffled: false,
      startLevel: 1,
      isTableMode: false,
      isRandomTurns: false,
      isPassThePhone: false,
      players: [],
    });
  });

  it("drops the session when no deck matches", () => {
    setLegacyProgress(2, "Unknown Deck");
    migrateLegacyStorage(decks);
    expect(loadProgress()).toBeNull();
  });

  it("drops a session whose counter is past the last card", () => {
    setLegacyProgress(99, "Date Night");
    migrateLegacyStorage(decks);
    expect(loadProgress()).toBeNull();
  });

  it("matches through the fixed v1 title map even when the live title was renamed", () => {
    setLegacyProgress(1, "  DATE NIGHT ");
    migrateLegacyStorage(decks);
    expect(loadProgress()?.deckId).toBe("date-night");
  });

  it("keeps a session at the last card (savedCounter = length - 1)", () => {
    setLegacyProgress(3, "Date Night");
    migrateLegacyStorage(decks);
    expect(loadProgress()?.position).toBe(3);
  });

  it("drops a session whose counter equals the deck length", () => {
    setLegacyProgress(4, "Date Night");
    migrateLegacyStorage(decks);
    expect(loadProgress()).toBeNull();
  });

  it("clamps a negative counter to the first card", () => {
    setLegacyProgress(-4, "Date Night");
    migrateLegacyStorage(decks);
    expect(loadProgress()?.position).toBe(0);
  });

  it("drops a v1 session with malformed JSON", () => {
    localStorage.setItem("gameProgress", "{oops");
    migrateLegacyStorage(decks);
    expect(loadProgress()).toBeNull();
    expect(localStorage.getItem("gameProgress")).toBeNull();
  });

  it("turns ageConfirmed true into the v2 age flag", () => {
    localStorage.setItem("ageConfirmed", "true");
    migrateLegacyStorage(decks);
    expect(isAgeConfirmed()).toBe(true);
  });

  it("removes both v1 keys afterwards", () => {
    setLegacyProgress(1, "First Date");
    localStorage.setItem("ageConfirmed", "true");
    migrateLegacyStorage(decks);
    expect(localStorage.getItem("gameProgress")).toBeNull();
    expect(localStorage.getItem("ageConfirmed")).toBeNull();
  });

  it("keeps existing v2 progress", () => {
    saveProgress(
      buildProgress({ deckId: "date-night", order: ["a", "b"], position: 1 })
    );
    setLegacyProgress(2, "First Date");
    migrateLegacyStorage(decks);
    expect(loadProgress()?.deckId).toBe("date-night");
    expect(localStorage.getItem("gameProgress")).toBeNull();
  });

  it("marks a v1 player as returning from 1.0.0 so What's new lists v2", () => {
    setLegacyProgress(2, "First Date");
    migrateLegacyStorage(decks);
    expect(settingsStore.get().lastSeenVersion).toBe("1.0.0");
  });

  it("keeps a lastSeenVersion that v2 already stored", () => {
    updateSettings({ lastSeenVersion: "2.0.0" });
    localStorage.setItem("ageConfirmed", "true");
    migrateLegacyStorage(decks);
    expect(settingsStore.get().lastSeenVersion).toBe("2.0.0");
  });

  it("leaves lastSeenVersion empty for a first visit with no v1 keys", () => {
    migrateLegacyStorage(decks);
    expect(settingsStore.get().lastSeenVersion).toBe("");
  });

  it("is a no-op the second time", () => {
    setLegacyProgress(2, "First Date");
    migrateLegacyStorage(decks);
    clearProgress();
    migrateLegacyStorage(decks);
    expect(loadProgress()).toBeNull();
  });
});
