import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  recordCardSeen,
  recordDeckFinish,
  recordDeckStart,
  resetStats,
  statsStore,
  useStats,
} from "./stats";

describe("stats", () => {
  beforeEach(() => localStorage.clear());

  it("starts at zero", () => {
    expect(statsStore.get()).toEqual({
      decksStarted: {},
      decksFinished: {},
      cardsSeen: 0,
      millisecondsPlayed: 0,
    });
  });

  it("counts deck starts per deck", () => {
    recordDeckStart("first-date");
    recordDeckStart("first-date");
    recordDeckStart("road-trip");
    expect(statsStore.get().decksStarted).toEqual({
      "first-date": 2,
      "road-trip": 1,
    });
  });

  it("counts cards seen", () => {
    recordCardSeen();
    recordCardSeen();
    expect(statsStore.get().cardsSeen).toBe(2);
  });

  it("counts finishes and adds the time played", () => {
    recordDeckFinish("first-date", 60_000);
    recordDeckFinish("first-date", 30_000);
    expect(statsStore.get().decksFinished).toEqual({ "first-date": 2 });
    expect(statsStore.get().millisecondsPlayed).toBe(90_000);
  });

  it("ignores a negative or non-finite duration", () => {
    recordDeckFinish("first-date", -5);
    recordDeckFinish("first-date", Number.NaN);
    expect(statsStore.get().millisecondsPlayed).toBe(0);
    expect(statsStore.get().decksFinished["first-date"]).toBe(2);
  });

  it("resets everything", () => {
    recordDeckStart("first-date");
    recordCardSeen();
    resetStats();
    expect(statsStore.get().cardsSeen).toBe(0);
    expect(statsStore.get().decksStarted).toEqual({});
  });

  it("drops only the invalid counters and keeps the rest", () => {
    localStorage.setItem(
      "unravel:v2:stats",
      JSON.stringify({
        decksStarted: { "first-date": 3, broken: "x" },
        decksFinished: "oops",
        cardsSeen: "many",
        millisecondsPlayed: 5000,
      })
    );
    expect(statsStore.get()).toEqual({
      decksStarted: { "first-date": 3 },
      decksFinished: {},
      cardsSeen: 0,
      millisecondsPlayed: 5000,
    });
  });

  it("reads zeros when the stored value is not an object", () => {
    localStorage.setItem("unravel:v2:stats", "[]");
    expect(statsStore.get().cardsSeen).toBe(0);
  });

  it("updates the hook consumer", () => {
    const { result } = renderHook(() => useStats());
    act(() => recordCardSeen());
    expect(result.current.cardsSeen).toBe(1);
  });
});
