import { useMemo } from "react";
import { useSettings } from "../storage/settings";

const TAP_PATTERN = 10;
const SUCCESS_PATTERN = [12, 60, 18];
/** Two short taps then a longer one: the deck just went a level deeper. */
const LEVEL_UP_PATTERN = [16, 50, 16, 50, 40];

const vibrate = (pattern: number | number[]): void => {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function"
  )
    return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when vibration is blocked by a permissions policy.
  }
};

export interface Haptics {
  tap(): void;
  success(): void;
  levelUp(): void;
}

/** Short vibrations for taps, wins and a rise in level. Silent when the player turned haptics off or the device has no vibration. */
export function useHaptics(): Haptics {
  const [settings] = useSettings();
  const isEnabled = settings.isHapticsEnabled;

  return useMemo(
    () => ({
      tap: () => {
        if (isEnabled) vibrate(TAP_PATTERN);
      },
      success: () => {
        if (isEnabled) vibrate(SUCCESS_PATTERN);
      },
      levelUp: () => {
        if (isEnabled) vibrate(LEVEL_UP_PATTERN);
      },
    }),
    [isEnabled]
  );
}
