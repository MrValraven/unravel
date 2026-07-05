import { describe, it, expect, beforeEach } from "vitest";
import {
  saveGameProgress,
  clearGameProgress,
  getResumableSession,
  isAgeConfirmed,
  confirmAge,
} from "./gameProgress";

describe("gameProgress", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when there is no saved session", () => {
    expect(getResumableSession()).toBeNull();
  });

  it("treats a finished/empty session as not resumable (regression)", () => {
    // A completed game used to persist an empty pack, which wrongly surfaced a
    // dead "Resume" button on reload. It must now read as no session.
    saveGameProgress([], 0, "");
    expect(getResumableSession()).toBeNull();
  });

  it("treats a session at the last index as not resumable", () => {
    saveGameProgress(["a", "b"], 2, "Test");
    expect(getResumableSession()).toBeNull();
  });

  it("returns a mid-play session with its title", () => {
    saveGameProgress(["a", "b", "c"], 1, "Date Night");
    expect(getResumableSession()).toEqual({
      savedMode: ["a", "b", "c"],
      savedCounter: 1,
      savedTitle: "Date Night",
    });
  });

  it("clears saved progress", () => {
    saveGameProgress(["a", "b"], 0, "X");
    clearGameProgress();
    expect(getResumableSession()).toBeNull();
  });

  it("ignores corrupt JSON without throwing", () => {
    localStorage.setItem("gameProgress", "{not json");
    expect(getResumableSession()).toBeNull();
  });

  it("remembers the 18+ confirmation", () => {
    expect(isAgeConfirmed()).toBe(false);
    confirmAge();
    expect(isAgeConfirmed()).toBe(true);
  });
});
