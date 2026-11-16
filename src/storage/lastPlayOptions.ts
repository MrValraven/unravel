import { createStore, useStore } from "./createStore";
import { isPlayOptions, type PlayOptions } from "./progress";

const isStoredOptions = (raw: unknown): raw is PlayOptions | null =>
  raw === null || isPlayOptions(raw);

/**
 * The options of the last game started from Game options. Every other start
 * (the preview sheet, a deck page, a link) reuses them, so a group sets up once.
 */
export const lastPlayOptionsStore = createStore<PlayOptions | null>(
  "lastPlayOptions",
  null,
  isStoredOptions
);

/** Null until a game has been started from Game options. */
export function loadLastPlayOptions(): PlayOptions | null {
  return lastPlayOptionsStore.get();
}

export function saveLastPlayOptions(options: PlayOptions): void {
  lastPlayOptionsStore.set(options);
}

export function useLastPlayOptions(): PlayOptions | null {
  return useStore(lastPlayOptionsStore);
}
