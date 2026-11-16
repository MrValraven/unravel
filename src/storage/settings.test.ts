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
      theme: "default",
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
        theme: "light",
        textScale: 2,
      })
    );
    expect(settingsStore.get()).toEqual({
      ...defaultSettings,
      locale: "pt",
      theme: "light",
      textScale: 1,
    });
  });

  it("carries a saved dim mode switch over to the dim theme", () => {
    const { theme: _theme, ...withoutTheme } = defaultSettings;
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({ ...withoutTheme, locale: "pt", isDimMode: true })
    );
    expect(settingsStore.get()).toEqual({
      ...defaultSettings,
      locale: "pt",
      theme: "dim",
    });
  });

  it("carries a saved dim mode that was off over to the default theme", () => {
    const { theme: _theme, ...withoutTheme } = defaultSettings;
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({ ...withoutTheme, isDimMode: false })
    );
    expect(settingsStore.get().theme).toBe("default");
  });

  it("prefers a stored theme over a leftover dim mode flag", () => {
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({ ...defaultSettings, theme: "light", isDimMode: true })
    );
    expect(settingsStore.get().theme).toBe("light");
  });

  it("falls back to the default theme for an unknown theme", () => {
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({ ...defaultSettings, theme: "sepia" })
    );
    expect(settingsStore.get().theme).toBe("default");
  });

  it("drops the old dim mode flag on the next save", () => {
    localStorage.setItem(
      "unravel:v2:settings",
      JSON.stringify({ ...defaultSettings, isDimMode: true, theme: undefined })
    );
    updateSettings({ textScale: 1.15 });
    const saved = JSON.parse(
      localStorage.getItem("unravel:v2:settings") ?? "{}"
    ) as Record<string, unknown>;
    expect(saved.theme).toBe("dim");
    expect(saved).not.toHaveProperty("isDimMode");
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
    expect(result.current[0].theme).toBe("default");
    act(() => result.current[1]({ theme: "light" }));
    expect(result.current[0].theme).toBe("light");
  });
});
