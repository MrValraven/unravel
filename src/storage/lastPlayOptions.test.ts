import { beforeEach, describe, expect, it } from "vitest";
import { loadLastPlayOptions, saveLastPlayOptions } from "./lastPlayOptions";

const options = {
  isShuffled: true,
  startLevel: 2 as const,
  isTableMode: false,
  isRandomTurns: false,
  isPassThePhone: false,
  players: ["Ana", "Rui"],
};

describe("last play options", () => {
  beforeEach(() => window.localStorage.clear());

  it("is null until a game starts from Game options", () => {
    expect(loadLastPlayOptions()).toBeNull();
  });

  it("keeps the saved options", () => {
    saveLastPlayOptions(options);
    expect(loadLastPlayOptions()).toEqual(options);
    expect(
      JSON.parse(
        window.localStorage.getItem("unravel:v2:lastPlayOptions") ?? "null"
      )
    ).toEqual(options);
  });

  it("loads options saved before random turns and pass-the-phone as off", () => {
    const { isRandomTurns: _r, isPassThePhone: _p, ...oldOptions } = options;
    window.localStorage.setItem(
      "unravel:v2:lastPlayOptions",
      JSON.stringify(oldOptions)
    );
    expect(loadLastPlayOptions()).toEqual(options);
  });

  it("keeps random turns saved with four names", () => {
    const fourNames = {
      ...options,
      isRandomTurns: true,
      players: ["Ana", "Rui", "Eva", "Leo"],
    };
    saveLastPlayOptions(fourNames);
    expect(loadLastPlayOptions()).toEqual(fourNames);
  });

  it("rejects options whose new flags are not booleans", () => {
    window.localStorage.setItem(
      "unravel:v2:lastPlayOptions",
      JSON.stringify({ ...options, isRandomTurns: "on" })
    );
    expect(loadLastPlayOptions()).toBeNull();
  });

  it("reads damaged options as none", () => {
    window.localStorage.setItem(
      "unravel:v2:lastPlayOptions",
      JSON.stringify({ ...options, startLevel: 7 })
    );
    expect(loadLastPlayOptions()).toBeNull();
  });
});
