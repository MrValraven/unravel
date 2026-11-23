import { createStore, useStore } from "./createStore";
import { requestPersistentStorage } from "./persistence";

/** Favourited cards form a playable deck once there are at least this many. */
export const MIN_FAVOURITES_FOR_DECK = 5;

export const isFavouriteIdList = (raw: unknown): raw is string[] =>
  Array.isArray(raw) && raw.every((item) => typeof item === "string");

export const favouritesStore = createStore<string[]>(
  "favourites",
  [],
  isFavouriteIdList
);

/** Card ids in the order they were favourited. */
export function getFavouriteIds(): string[] {
  return favouritesStore.get();
}

export function toggleFavourite(cardId: string): void {
  const isAdding = !favouritesStore.get().includes(cardId);
  favouritesStore.set((previous) =>
    previous.includes(cardId)
      ? previous.filter((favouriteId) => favouriteId !== cardId)
      : [...previous, cardId]
  );
  if (isAdding) requestPersistentStorage();
}

export function useFavouriteIds(): string[] {
  return useStore(favouritesStore);
}
