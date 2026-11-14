import { useMemo } from "react";
import { useSettings } from "../storage/settings";

const TAP_PATTERN = 10;
const SUCCESS_PATTERN = [12, 60, 18];

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

/** Short vibrations for taps and wins. Silent when the player turned haptics off or the device has no vibration. */
export function useHaptics(): { tap(): void; success(): void } {
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
    }),
    [isEnabled]
  );
}
