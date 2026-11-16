import { createStore, useStore } from "./createStore";

const isBoolean = (raw: unknown): raw is boolean => typeof raw === "boolean";

/** True once the player has answered the one-time "play in Portuguese?" suggestion. */
export const languageSuggestionStore = createStore<boolean>(
  "languageSuggestionDismissed",
  false,
  isBoolean
);

export function dismissLanguageSuggestion(): void {
  languageSuggestionStore.set(true);
}

export function useLanguageSuggestionDismissed(): boolean {
  return useStore(languageSuggestionStore);
}
