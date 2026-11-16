import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateSettings } from "../storage/settings";
import { useHaptics } from "./useHaptics";

describe("useHaptics", () => {
  const vibrate = vi.fn((_pattern: VibratePattern) => true);

  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });
  });

  afterEach(() => {
    vibrate.mockClear();
    Reflect.deleteProperty(navigator, "vibrate");
  });

  it("gives the level up its own pattern", () => {
    const { result } = renderHook(() => useHaptics());
    result.current.tap();
    result.current.levelUp();
    const [tapPattern, levelUpPattern] = vibrate.mock.calls.map(
      ([pattern]) => pattern
    );
    expect(levelUpPattern).not.toEqual(tapPattern);
    expect(Array.isArray(levelUpPattern)).toBe(true);
  });

  it("stays still when haptics are off", () => {
    updateSettings({ isHapticsEnabled: false });
    const { result } = renderHook(() => useHaptics());
    result.current.levelUp();
    expect(vibrate).not.toHaveBeenCalled();
  });
});
