/** Router state the editor and import page hand to /custom after a save. */
export interface SavedDeckState {
  savedDeckTitle: string;
}

export const createSavedDeckState = (
  savedDeckTitle: string
): SavedDeckState => ({
  savedDeckTitle,
});

export const readSavedDeckTitle = (state: unknown): string | undefined => {
  if (typeof state !== "object" || state === null) return undefined;
  const title = (state as Record<string, unknown>).savedDeckTitle;
  return typeof title === "string" && title.length > 0 ? title : undefined;
};
