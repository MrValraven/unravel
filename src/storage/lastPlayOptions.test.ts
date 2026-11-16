import { beforeEach, describe, expect, it } from "vitest";
import { loadLastPlayOptions, saveLastPlayOptions } from "./lastPlayOptions";

const options = {
  isShuffled: true,
  startLevel: 2 as const,
  isTableMode: false,
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

  it("reads damaged options as none", () => {
    window.localStorage.setItem(
      "unravel:v2:lastPlayOptions",
      JSON.stringify({ ...options, startLevel: 7 })
    );
    expect(loadLastPlayOptions()).toBeNull();
  });
});
