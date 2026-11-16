import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  hasSeenCoachMark,
  markCoachMarkSeen,
  useCoachMarks,
} from "./coachMarks";

const storageKey = "unravel:v2:coachMarks";

describe("coachMarks", () => {
  beforeEach(() => localStorage.clear());

  it("starts with nothing seen", () => {
    expect(hasSeenCoachMark("playGestureHint")).toBe(false);
  });

  it("remembers a seen hint", () => {
    markCoachMarkSeen("playGestureHint");
    expect(hasSeenCoachMark("playGestureHint")).toBe(true);
    expect(JSON.parse(localStorage.getItem(storageKey) ?? "null")).toEqual({
      playGestureHint: true,
    });
  });

  it("reads a broken flag as not seen", () => {
    localStorage.setItem(storageKey, '{"playGestureHint":"yes"}');
    expect(hasSeenCoachMark("playGestureHint")).toBe(false);
    localStorage.setItem(storageKey, "[true]");
    expect(hasSeenCoachMark("playGestureHint")).toBe(false);
  });

  it("updates the hook consumer", () => {
    const { result } = renderHook(() => useCoachMarks());
    expect(result.current.playGestureHint).toBe(false);
    act(() => markCoachMarkSeen("playGestureHint"));
    expect(result.current.playGestureHint).toBe(true);
  });
});
