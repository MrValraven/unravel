import { describe, it, expect } from "vitest";
import { detectPlatform } from "./usePwaInstall";

describe("detectPlatform", () => {
  it("detects iOS from an iPhone user agent", () => {
    expect(
      detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
    ).toBe("ios");
  });

  it("detects Android from a Pixel user agent", () => {
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe(
      "android"
    );
  });

  it("defaults to desktop for a Windows user agent", () => {
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      "desktop"
    );
  });

  it("defaults to desktop for an empty user agent", () => {
    expect(detectPlatform("")).toBe("desktop");
  });
});
