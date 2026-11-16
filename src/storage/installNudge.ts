import { createStore, useStore } from "./createStore";

/** Where the inline install card can appear. Each place remembers its own dismissal. */
export type InstallNudgePlacement = "home" | "deck-end";

const knownPlacements: Record<InstallNudgePlacement, true> = {
  home: true,
  "deck-end": true,
};

const isPlacement = (raw: unknown): raw is InstallNudgePlacement =>
  typeof raw === "string" && Object.hasOwn(knownPlacements, raw);

/** Keeps the known placements of a stored list and drops anything else. */
const normalizeDismissed = (
  raw: unknown
): InstallNudgePlacement[] | undefined =>
  Array.isArray(raw) ? [...new Set(raw.filter(isPlacement))] : undefined;

const isDismissedList = (raw: unknown): raw is InstallNudgePlacement[] =>
  Array.isArray(raw) && raw.every(isPlacement);

export const installNudgeStore = createStore<InstallNudgePlacement[]>(
  "installNudgeDismissed",
  [],
  isDismissedList,
  normalizeDismissed
);

export function dismissInstallNudge(placement: InstallNudgePlacement): void {
  installNudgeStore.set((previous) =>
    previous.includes(placement) ? previous : [...previous, placement]
  );
}

export function isInstallNudgeDismissed(
  placement: InstallNudgePlacement
): boolean {
  return installNudgeStore.get().includes(placement);
}

export function useIsInstallNudgeDismissed(
  placement: InstallNudgePlacement
): boolean {
  return useStore(installNudgeStore).includes(placement);
}
