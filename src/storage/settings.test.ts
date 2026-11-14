import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  defaultSettings,
  settingsStore,
  updateSettings,
  useSettings,
} from "./settings";

describe("settings", () => {
  beforeEach(() => localStorage.clear());

  it("has the documented defaults", () => {
    expect(settingsStore.get()).toEqual({
      locale: "en",
      textScale: 1,
      isDimMode: false,
      isHapticsEnabled: true,
      hasSeenIntro: false,
      lastSeenVersion: "",
    });
  });

  it("merges a patch into the current settings", () => {
    updateSettings({ locale: "pt", textScale: 1.3 });
    expect(settingsStore.get()).toEqual({
      ...defaultSettings,
      locale: "pt",
      textScale: 1.3,
    });
  });

  it("resets only the bad field and keeps the player's other settings", () => {
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({
        ...defaultSettings,
        locale: "pt",
        isDimMode: true,
        textScale: 2,
      })
    );
    expect(settingsStore.get()).toEqual({
      ...defaultSettings,
      locale: "pt",
      isDimMode: true,
      textScale: 1,
    });
  });

  it("fills a field missing from older stored settings with its default", () => {
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({ locale: "pt", textScale: 1.15 })
    );
    expect(settingsStore.get()).toEqual({
      ...defaultSettings,
      locale: "pt",
      textScale: 1.15,
    });
  });

  it("falls back to defaults for an unknown locale", () => {
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({ ...defaultSettings, locale: "fr" })
    );
    expect(settingsStore.get().locale).toBe("en");
  });

  it("falls back to defaults when the stored value is not an object", () => {
    localStorage.setItem("unravel:v2:settings", "5");
    expect(settingsStore.get()).toEqual(defaultSettings);
  });

  it("updates the hook consumer", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current[0].isDimMode).toBe(false);
    act(() => result.current[1]({ isDimMode: true }));
    expect(result.current[0].isDimMode).toBe(true);
  });
});
