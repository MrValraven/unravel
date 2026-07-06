import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// The hook is a thin wrapper over vite-plugin-pwa's virtual module, which does
// not exist in jsdom — so mock it and drive its state from the tests.
const { swState, updateServiceWorker } = vi.hoisted(() => ({
  swState: { needRefresh: false },
  updateServiceWorker: vi.fn(),
}));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [swState.needRefresh, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}));

import { useAppUpdate } from "./useAppUpdate";

describe("useAppUpdate", () => {
  beforeEach(() => {
    swState.needRefresh = false;
    updateServiceWorker.mockClear();
  });

  it("reports no update when the service worker is not waiting", () => {
    swState.needRefresh = false;
    const { result } = renderHook(() => useAppUpdate());
    expect(result.current.updateAvailable).toBe(false);
  });

  it("reports an update when a new service worker is waiting", () => {
    swState.needRefresh = true;
    const { result } = renderHook(() => useAppUpdate());
    expect(result.current.updateAvailable).toBe(true);
  });

  it("applies the waiting update (with reload) when applyUpdate is called", () => {
    swState.needRefresh = true;
    const { result } = renderHook(() => useAppUpdate());
    act(() => {
      result.current.applyUpdate();
    });
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });
});
