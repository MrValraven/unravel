import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setStorageManager = (storage: unknown) => {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: storage,
  });
};

/** jsdom has no matchMedia; a stub answers the standalone display-mode query. */
const setStandaloneDisplay = (isStandalone: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: isStandalone && query === "(display-mode: standalone)",
      media: query,
    }),
  });
};

const setIosStandalone = (isStandalone: boolean) => {
  Object.defineProperty(navigator, "standalone", {
    configurable: true,
    value: isStandalone,
  });
};

const loadFresh = async () => {
  vi.resetModules();
  return import("./persistence");
};

afterEach(() => {
  // jsdom has none of these, so removing the stubs restores the original state.
  Reflect.deleteProperty(navigator, "storage");
  Reflect.deleteProperty(navigator, "standalone");
  Reflect.deleteProperty(window, "matchMedia");
  vi.restoreAllMocks();
});

describe("requestPersistentStorage in the installed app", () => {
  beforeEach(() => setStandaloneDisplay(true));

  it("asks the browser to persist storage once per page load", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    setStorageManager({ persist });
    const { requestPersistentStorage } = await loadFresh();
    requestPersistentStorage();
    requestPersistentStorage();
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the browser has no storage manager", async () => {
    setStorageManager(undefined);
    const { requestPersistentStorage } = await loadFresh();
    expect(() => requestPersistentStorage()).not.toThrow();
  });

  it("does nothing when the storage manager cannot persist", async () => {
    setStorageManager({});
    const { requestPersistentStorage } = await loadFresh();
    expect(() => requestPersistentStorage()).not.toThrow();
  });

  it("swallows a refused request", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const persist = vi.fn().mockRejectedValue(new Error("refused"));
    setStorageManager({ persist });
    const { requestPersistentStorage } = await loadFresh();
    expect(() => requestPersistentStorage()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off("unhandledRejection", unhandled);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("swallows a request that throws at once", async () => {
    setStorageManager({
      persist: () => {
        throw new Error("blocked");
      },
    });
    const { requestPersistentStorage } = await loadFresh();
    expect(() => requestPersistentStorage()).not.toThrow();
  });
});

describe("requestPersistentStorage outside the installed app", () => {
  it("asks nothing in a browser tab", async () => {
    setStandaloneDisplay(false);
    const persist = vi.fn().mockResolvedValue(true);
    setStorageManager({ persist });
    const { requestPersistentStorage } = await loadFresh();
    requestPersistentStorage();
    expect(persist).not.toHaveBeenCalled();
  });

  it("asks nothing where the browser has no matchMedia", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    setStorageManager({ persist });
    const { requestPersistentStorage } = await loadFresh();
    requestPersistentStorage();
    expect(persist).not.toHaveBeenCalled();
  });

  it("asks once in an iOS home-screen app", async () => {
    setStandaloneDisplay(false);
    setIosStandalone(true);
    const persist = vi.fn().mockResolvedValue(true);
    setStorageManager({ persist });
    const { requestPersistentStorage } = await loadFresh();
    requestPersistentStorage();
    requestPersistentStorage();
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
