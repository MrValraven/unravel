import { useSyncExternalStore } from "react";

export const STORAGE_KEY_PREFIX = "unravel:v2:";

export interface Store<Value> {
  get(): Value;
  /** True when the value reached localStorage, false when it was kept in memory only. */
  set(next: Value | ((previous: Value) => Value)): boolean;
  subscribe(listener: () => void): () => void;
}

/**
 * A localStorage-backed store. `key` is the short name; the stored key is
 * `unravel:v2:<key>`.
 *
 * - `get()` returns a referentially stable value until the stored text changes,
 *   so it is safe as a `useSyncExternalStore` snapshot.
 * - Stored text that is not valid JSON, or fails `isValid`, reads as `fallback`.
 * - When `normalize` is given it replaces `isValid`: it repairs what it can and returns
 *   `undefined` only when nothing is salvageable, which reads as `fallback`.
 * - When storage is blocked, reads return the in-memory value (the fallback until
 *   something is set) and writes only update memory; `set` returns false for them.
 * - Changes made by other tabs arrive through the window `storage` event.
 */
export function createStore<Value>(
  key: string,
  fallback: Value,
  isValid: (raw: unknown) => raw is Value,
  normalize?: (raw: unknown) => Value | undefined
): Store<Value> {
  const storageKey = STORAGE_KEY_PREFIX + key;
  const listeners = new Set<() => void>();
  let cachedValue: Value = fallback;
  let cachedRawText: string | null = null;
  let hasLoaded = false;

  const parseStoredText = (rawText: string | null): Value => {
    if (rawText === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(rawText);
      if (normalize) return normalize(parsed) ?? fallback;
      return isValid(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const get = (): Value => {
    let rawText: string | null;
    try {
      rawText = window.localStorage.getItem(storageKey);
    } catch {
      return cachedValue;
    }
    if (hasLoaded && rawText === cachedRawText) return cachedValue;
    hasLoaded = true;
    cachedRawText = rawText;
    cachedValue = parseStoredText(rawText);
    return cachedValue;
  };

  const notifyListeners = () => {
    for (const listener of Array.from(listeners)) listener();
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === null || event.key === storageKey) notifyListeners();
  };

  const set = (next: Value | ((previous: Value) => Value)): boolean => {
    const previousValue = get();
    const nextValue =
      typeof next === "function"
        ? (next as (previous: Value) => Value)(previousValue)
        : next;
    const serialized = JSON.stringify(nextValue);
    let hasWritten = false;
    try {
      window.localStorage.setItem(storageKey, serialized);
      cachedRawText = serialized;
      hasWritten = true;
    } catch {
      // Storage is blocked or full: keep the value in memory for this session.
    }
    hasLoaded = true;
    cachedValue = nextValue;
    notifyListeners();
    return hasWritten;
  };

  const subscribe = (listener: () => void) => {
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageEvent);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageEvent);
      }
    };
  };

  return { get, set, subscribe };
}

export function useStore<Value>(store: Store<Value>): Value {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
