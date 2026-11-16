import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWakeLock } from "./useWakeLock";

interface FakeSentinel {
  released: boolean;
  release: ReturnType<typeof vi.fn>;
}

const makeSentinel = (): FakeSentinel => {
  const sentinel: FakeSentinel = {
    released: false,
    release: vi.fn(() => {
      sentinel.released = true;
      return Promise.resolve();
    }),
  };
  return sentinel;
};

const installWakeLock = () => {
  const sentinels: FakeSentinel[] = [];
  const request = vi.fn(() => {
    const sentinel = makeSentinel();
    sentinels.push(sentinel);
    return Promise.resolve(sentinel);
  });
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: { request },
  });
  return { request, sentinels };
};

let visibility: DocumentVisibilityState = "visible";
const setVisibility = (state: DocumentVisibilityState) => {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
};

Object.defineProperty(document, "visibilityState", {
  configurable: true,
  get: () => visibility,
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useWakeLock", () => {
  afterEach(() => {
    visibility = "visible";
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  it("asks for a screen lock on mount and releases it on unmount", async () => {
    const { request, sentinels } = installWakeLock();
    const { unmount } = renderHook(() => useWakeLock());
    await flush();
    expect(request).toHaveBeenCalledWith("screen");
    expect(sentinels).toHaveLength(1);

    unmount();
    expect(sentinels[0]?.release).toHaveBeenCalled();
  });

  it("asks again when the page comes back into view", async () => {
    const { request, sentinels } = installWakeLock();
    renderHook(() => useWakeLock());
    await flush();
    expect(request).toHaveBeenCalledTimes(1);

    // The browser drops the lock while the page is hidden.
    const firstSentinel = sentinels[0];
    if (firstSentinel) firstSentinel.released = true;
    setVisibility("hidden");
    await flush();
    expect(request).toHaveBeenCalledTimes(1);

    setVisibility("visible");
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not ask while inactive", async () => {
    const { request } = installWakeLock();
    renderHook(() => useWakeLock(false));
    await flush();
    expect(request).not.toHaveBeenCalled();
  });

  it("stays quiet when the browser refuses", async () => {
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request: vi.fn(() => Promise.reject(new Error("denied"))) },
    });
    const { unmount } = renderHook(() => useWakeLock());
    await flush();
    expect(() => unmount()).not.toThrow();
  });

  it("does nothing where the API is missing", () => {
    expect(() => renderHook(() => useWakeLock()).unmount()).not.toThrow();
  });
});
