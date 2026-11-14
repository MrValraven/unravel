import { describe, it, expect } from "vitest";
import { detectPlatform } from "./usePwaInstall";

describe("detectPlatform", () => {
  it("detects iOS from an iPhone user agent", () => {
    expect(
      detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
    ).toBe("ios");
  });

  it("detects iPadOS from a Mac user agent with a touch screen", () => {
    expect(
      detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)
    ).toBe("ios");
  });

  it("keeps a Mac without a touch screen on the desktop steps", () => {
    expect(
      detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)
    ).toBe("desktop");
  });

  it("detects Android from a Pixel user agent", () => {
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe(
      "android"
    );
  });

  it("uses the desktop steps for a Windows user agent", () => {
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      "desktop"
    );
  });

  it("uses the desktop steps for an empty user agent", () => {
    expect(detectPlatform("")).toBe("desktop");
  });
});
