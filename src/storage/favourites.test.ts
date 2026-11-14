import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  MIN_FAVOURITES_FOR_DECK,
  getFavouriteIds,
  toggleFavourite,
  useFavouriteIds,
} from "./favourites";

describe("favourites", () => {
  beforeEach(() => localStorage.clear());

  it("exposes the minimum for a favourites deck", () => {
    expect(MIN_FAVOURITES_FOR_DECK).toBe(5);
  });

  it("starts empty", () => {
    expect(getFavouriteIds()).toEqual([]);
  });

  it("adds in the order favourited and removes on a second toggle", () => {
    toggleFavourite("first-date-003");
    toggleFavourite("first-date-001");
    expect(getFavouriteIds()).toEqual(["first-date-003", "first-date-001"]);
    toggleFavourite("first-date-003");
    expect(getFavouriteIds()).toEqual(["first-date-001"]);
  });

  it("reads an empty list when the stored value is not a string list", () => {
    localStorage.setItem("unravel:v2:favourites", "[1,2]");
    expect(getFavouriteIds()).toEqual([]);
  });

  it("updates the hook consumer", () => {
    const { result } = renderHook(() => useFavouriteIds());
    act(() => toggleFavourite("a-001"));
    expect(result.current).toEqual(["a-001"]);
  });
});
