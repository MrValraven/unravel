import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mixHexColors, useTintedThemeColor } from "./useThemeColor";

describe("mixHexColors", () => {
  it("mixes the tint into the base by the given amount", () => {
    expect(mixHexColors("#ffffff", "#000000", 0.5)).toBe("#808080");
    expect(mixHexColors("#eebbc3", "#232946", 0)).toBe("#232946");
    expect(mixHexColors("#eebbc3", "#232946", 1)).toBe("#eebbc3");
  });

  it("reads three digit colours", () => {
    expect(mixHexColors("#fff", "#000", 1)).toBe("#ffffff");
  });

  it("keeps the base when a colour is not hex", () => {
    expect(mixHexColors("pink", "#232946", 0.5)).toBe("#232946");
    expect(mixHexColors("#eebbc3", "navy", 0.5)).toBe("navy");
  });
});

describe("useTintedThemeColor", () => {
  let meta: HTMLMetaElement;

  beforeEach(() => {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#000000";
    document.head.append(meta);
  });

  afterEach(() => meta.remove());

  it("tints the browser chrome and restores it on unmount", () => {
    const { unmount } = renderHook(() => useTintedThemeColor("#ffffff", 0.5));
    expect(meta.content).toBe("#808080");
    unmount();
    expect(meta.content).toBe("#000000");
  });

  it("follows a theme switch while mounted", async () => {
    const { unmount } = renderHook(() => useTintedThemeColor("#ffffff", 0.5));
    meta.content = "#ffffff";
    await waitFor(() => expect(meta.content).toBe("#ffffff"));
    meta.content = "#000000";
    await waitFor(() => expect(meta.content).toBe("#808080"));
    unmount();
    expect(meta.content).toBe("#000000");
  });
});
