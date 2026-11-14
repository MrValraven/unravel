import { createStore, useStore } from "./createStore";

/** Favourited cards form a playable deck once there are at least this many. */
export const MIN_FAVOURITES_FOR_DECK = 5;

const isStringList = (raw: unknown): raw is string[] =>
  Array.isArray(raw) && raw.every((item) => typeof item === "string");

export const favouritesStore = createStore<string[]>(
  "favourites",
  [],
  isStringList
);

/** Card ids in the order they were favourited. */
export function getFavouriteIds(): string[] {
  return favouritesStore.get();
}

export function toggleFavourite(cardId: string): void {
  favouritesStore.set((previous) =>
    previous.includes(cardId)
      ? previous.filter((favouriteId) => favouriteId !== cardId)
      : [...previous, cardId]
  );
}

export function useFavouriteIds(): string[] {
  return useStore(favouritesStore);
}
