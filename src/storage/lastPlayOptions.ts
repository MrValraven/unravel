import { createStore, useStore } from "./createStore";
import { readPlayOptions, type PlayOptions } from "./progress";

/** Null is a valid stored value (no game started yet); undefined means the stored options are unusable. */
const readStoredOptions = (raw: unknown): PlayOptions | null | undefined =>
  raw === null ? null : readPlayOptions(raw);

const isStoredOptions = (raw: unknown): raw is PlayOptions | null =>
  readStoredOptions(raw) !== undefined;

/**
 * The options of the last game started from Game options. Every other start
 * (the preview sheet, a deck page, a link) reuses them, so a group sets up once.
 */
export const lastPlayOptionsStore = createStore<PlayOptions | null>(
  "lastPlayOptions",
  null,
  isStoredOptions,
  readStoredOptions
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
