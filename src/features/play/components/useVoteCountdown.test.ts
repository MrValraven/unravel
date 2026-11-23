import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVoteCountdown } from "./useVoteCountdown";

describe("useVoteCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts 3, 2, 1 then Point! and calls onPoint once", () => {
    const onPoint = vi.fn();
    const { result } = renderHook(() => useVoteCountdown(onPoint));
    expect(result.current.step).toBeNull();

    act(() => result.current.start());
    expect(result.current.step).toBe(3);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.step).toBe(2);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.step).toBe(1);
    expect(onPoint).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.step).toBe("point");
    expect(onPoint).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(1499));
    expect(result.current.step).toBe("point");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.step).toBeNull();
    expect(onPoint).toHaveBeenCalledTimes(1);
  });

  it("ignores start while counting", () => {
    const onPoint = vi.fn();
    const { result } = renderHook(() => useVoteCountdown(onPoint));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.start());
    expect(result.current.step).toBe(2);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.step).toBe("point");
    act(() => result.current.start());
    expect(result.current.step).toBe("point");
    expect(onPoint).toHaveBeenCalledTimes(1);
  });

  it("can count again once it has finished", () => {
    const onPoint = vi.fn();
    const { result } = renderHook(() => useVoteCountdown(onPoint));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(4500));
    expect(result.current.step).toBeNull();

    act(() => result.current.start());
    expect(result.current.step).toBe(3);
  });

  it("clears its timers on unmount", () => {
    const onPoint = vi.fn();
    const { result, unmount } = renderHook(() => useVoteCountdown(onPoint));
    act(() => result.current.start());
    unmount();
    vi.advanceTimersByTime(5000);
    expect(onPoint).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
