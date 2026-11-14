import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createStore, useStore, STORAGE_KEY_PREFIX } from "./createStore";

const isNumber = (raw: unknown): raw is number => typeof raw === "number";
let keyCounter = 0;
const createCounterStore = (fallback = 0) => {
  keyCounter += 1;
  const key = `test-counter-${keyCounter}`;
  return { key, store: createStore<number>(key, fallback, isNumber) };
};

describe("createStore", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("returns the fallback when nothing is stored", () => {
    const { store } = createCounterStore(7);
    expect(store.get()).toBe(7);
  });

  it("writes JSON under the unravel:v2: prefix", () => {
    const { key, store } = createCounterStore();
    store.set(3);
    expect(localStorage.getItem(STORAGE_KEY_PREFIX + key)).toBe("3");
    expect(store.get()).toBe(3);
  });

  it("accepts an updater function", () => {
    const { store } = createCounterStore(1);
    store.set((previous) => previous + 4);
    expect(store.get()).toBe(5);
  });

  it("reads the fallback when the stored text is not valid JSON", () => {
    const { key, store } = createCounterStore(9);
    localStorage.setItem(STORAGE_KEY_PREFIX + key, "{oops");
    expect(store.get()).toBe(9);
  });

  it("reads the fallback when the stored value fails validation", () => {
    const { key, store } = createCounterStore(9);
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify("text"));
    expect(store.get()).toBe(9);
  });

  it("returns the same reference until the stored text changes", () => {
    const keyName = `test-object-${keyCounter++}`;
    const isObject = (raw: unknown): raw is { count: number } =>
      typeof raw === "object" && raw !== null;
    const store = createStore(keyName, { count: 0 }, isObject);
    store.set({ count: 1 });
    expect(store.get()).toBe(store.get());
    localStorage.setItem(STORAGE_KEY_PREFIX + keyName, '{"count":2}');
    const reread = store.get();
    expect(reread).toEqual({ count: 2 });
    expect(store.get()).toBe(reread);
  });

  it("notifies subscribers on set and stops after unsubscribe", () => {
    const { store } = createCounterStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set(1);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies subscribers when another tab changes its key", () => {
    const { key, store } = createCounterStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    localStorage.setItem(STORAGE_KEY_PREFIX + key, "42");
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY_PREFIX + key })
    );
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toBe(42);
    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("reads the fallback when localStorage throws on read", () => {
    const { store } = createCounterStore(5);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(store.get()).toBe(5);
  });

  it("drops the write silently and keeps the value in memory when setItem throws", () => {
    const { store } = createCounterStore();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => store.set(8)).not.toThrow();
    expect(store.get()).toBe(8);
    expect(localStorage.length).toBe(0);
  });

  it("uses normalize instead of isValid when given", () => {
    const keyName = `test-normalize-${keyCounter++}`;
    const store = createStore<number>(keyName, 0, isNumber, (raw) =>
      typeof raw === "string" ? Number(raw) : undefined
    );
    localStorage.setItem(STORAGE_KEY_PREFIX + keyName, '"12"');
    expect(store.get()).toBe(12);
    localStorage.setItem(STORAGE_KEY_PREFIX + keyName, "true");
    expect(store.get()).toBe(0);
  });

  it("applies a function updater in memory when setItem throws", () => {
    const { store } = createCounterStore(2);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    store.set((previous) => previous + 1);
    store.set((previous) => previous * 10);
    expect(store.get()).toBe(30);
  });

  it("renders a hook with a stable snapshot while getItem throws", () => {
    const keyName = `test-object-blocked-${keyCounter++}`;
    const isObject = (raw: unknown): raw is { count: number } =>
      typeof raw === "object" && raw !== null;
    const store = createStore(keyName, { count: 0 }, isObject);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    let renderCount = 0;
    const { result, rerender } = renderHook(() => {
      renderCount += 1;
      return useStore(store);
    });
    const firstSnapshot = result.current;
    rerender();
    expect(result.current).toBe(firstSnapshot);
    expect(renderCount).toBeLessThan(5);
    act(() => store.set({ count: 1 }));
    expect(result.current).toEqual({ count: 1 });
  });

  it("re-renders a hook consumer and keeps the snapshot stable", () => {
    const { store } = createCounterStore(0);
    const { result } = renderHook(() => useStore(store));
    expect(result.current).toBe(0);
    act(() => store.set(6));
    expect(result.current).toBe(6);
  });
});
