import { locales, type Locale } from "../content/types";
import { createStore, useStore, type Store } from "./createStore";

export type TextScale = 1 | 1.15 | 1.3;
export const textScales: readonly TextScale[] = [1, 1.15, 1.3];

/** Night is the navy default, dim the warm low-light palette, day the light one. */
export type Theme = "default" | "dim" | "light";
export const themes: readonly Theme[] = ["default", "dim", "light"];

export interface Settings {
  locale: Locale;
  textScale: TextScale;
  theme: Theme;
  isHapticsEnabled: boolean;
  hasSeenIntro: boolean;
  /** Empty on the first visit. */
  lastSeenVersion: string;
}

export const defaultSettings: Settings = {
  locale: "en",
  textScale: 1,
  theme: "default",
  isHapticsEnabled: true,
  hasSeenIntro: false,
  lastSeenVersion: "",
};

const isSettings = (raw: unknown): raw is Settings => {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  return (
    locales.includes(candidate.locale as Locale) &&
    textScales.includes(candidate.textScale as TextScale) &&
    themes.includes(candidate.theme as Theme) &&
    typeof candidate.isHapticsEnabled === "boolean" &&
    typeof candidate.hasSeenIntro === "boolean" &&
    typeof candidate.lastSeenVersion === "string"
  );
};

/**
 * The stored theme. Settings saved before the light theme have `isDimMode`
 * instead, so `true` there carries over as "dim".
 */
const readTheme = (candidate: Record<string, unknown>): Theme => {
  if (themes.includes(candidate.theme as Theme)) {
    return candidate.theme as Theme;
  }
  return candidate.isDimMode === true ? "dim" : defaultSettings.theme;
};

/** Keeps every stored field that is valid; a bad or missing field falls back alone. */
const normalizeSettings = (raw: unknown): Settings | undefined => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const candidate = raw as Record<string, unknown>;
  return {
    locale: locales.includes(candidate.locale as Locale)
      ? (candidate.locale as Locale)
      : defaultSettings.locale,
    textScale: textScales.includes(candidate.textScale as TextScale)
      ? (candidate.textScale as TextScale)
      : defaultSettings.textScale,
    theme: readTheme(candidate),
    isHapticsEnabled:
      typeof candidate.isHapticsEnabled === "boolean"
        ? candidate.isHapticsEnabled
        : defaultSettings.isHapticsEnabled,
    hasSeenIntro:
      typeof candidate.hasSeenIntro === "boolean"
        ? candidate.hasSeenIntro
        : defaultSettings.hasSeenIntro,
    lastSeenVersion:
      typeof candidate.lastSeenVersion === "string"
        ? candidate.lastSeenVersion
        : defaultSettings.lastSeenVersion,
  };
};

export const settingsStore: Store<Settings> = createStore<Settings>(
  "settings",
  defaultSettings,
  isSettings,
  normalizeSettings
);

export const updateSettings = (patch: Partial<Settings>): void => {
  settingsStore.set((previous) => ({ ...previous, ...patch }));
};

/** The setter is a stable module-level function; the returned tuple is a new array each render. */
export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  return [useStore(settingsStore), updateSettings];
}
