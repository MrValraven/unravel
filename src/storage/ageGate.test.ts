import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { confirmAge, isAgeConfirmed, useAgeConfirmed } from "./ageGate";

describe("ageGate", () => {
  beforeEach(() => localStorage.clear());

  it("starts unconfirmed", () => {
    expect(isAgeConfirmed()).toBe(false);
  });

  it("remembers the confirmation", () => {
    confirmAge();
    expect(isAgeConfirmed()).toBe(true);
    expect(localStorage.getItem("unravel:v2:ageConfirmed")).toBe("true");
  });

  it("ignores a stored value that is not a boolean", () => {
    localStorage.setItem("unravel:v2:ageConfirmed", '"yes"');
    expect(isAgeConfirmed()).toBe(false);
  });

  it("updates the hook consumer", () => {
    const { result } = renderHook(() => useAgeConfirmed());
    expect(result.current).toBe(false);
    act(() => confirmAge());
    expect(result.current).toBe(true);
  });
});
