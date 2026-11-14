import { describe, expect, it } from "vitest";
import {
  buildFooterText,
  buildShareFileName,
  fitFontSize,
  hexToRgba,
  wrapText,
} from "./shareLayout";

/** Every character is half a font size wide. */
const measureAtSize = (text: string, fontSize: number) =>
  text.length * fontSize * 0.5;
const measureTenPixelsPerCharacter = (text: string) => text.length * 10;

describe("wrapText", () => {
  it("keeps a short sentence on one line", () => {
    expect(wrapText("hello world", 500, measureTenPixelsPerCharacter)).toEqual([
      "hello world",
    ]);
  });

  it("breaks between words when a line is full", () => {
    expect(wrapText("aaa bbb ccc", 70, measureTenPixelsPerCharacter)).toEqual([
      "aaa bbb",
      "ccc",
    ]);
  });

  it("splits a single word wider than the line by character", () => {
    const lines = wrapText("abcdefghij", 40, measureTenPixelsPerCharacter);
    expect(lines).toEqual(["abcd", "efgh", "ij"]);
  });

  it("collapses repeated spaces and honours explicit line breaks", () => {
    expect(wrapText("a   b\n\nc", 500, measureTenPixelsPerCharacter)).toEqual([
      "a b",
      "",
      "c",
    ]);
  });

  it("returns one empty line for empty text", () => {
    expect(wrapText("", 100, measureTenPixelsPerCharacter)).toEqual([""]);
  });
});

describe("fitFontSize", () => {
  const baseOptions = {
    maxWidth: 400,
    maxHeight: 400,
    maxFontSize: 80,
    minFontSize: 20,
    lineHeightRatio: 1.25,
    measureText: measureAtSize,
  };

  it("uses the maximum size when the text is short", () => {
    const fitted = fitFontSize({ ...baseOptions, text: "Hi" });
    expect(fitted.fontSize).toBe(80);
    expect(fitted.isTruncated).toBe(false);
  });

  it("shrinks long text until it fits the box", () => {
    const text = "word ".repeat(40).trim();
    const fitted = fitFontSize({ ...baseOptions, text });
    expect(fitted.fontSize).toBeLessThan(80);
    expect(fitted.fontSize).toBeGreaterThanOrEqual(20);
    expect(fitted.lines.length * fitted.lineHeight).toBeLessThanOrEqual(400);
    expect(fitted.isTruncated).toBe(false);
  });

  it("truncates with an ellipsis when even the minimum size overflows", () => {
    const text = "word ".repeat(400).trim();
    const fitted = fitFontSize({ ...baseOptions, text });
    expect(fitted.fontSize).toBe(20);
    expect(fitted.isTruncated).toBe(true);
    expect(fitted.lines.at(-1)?.endsWith("…")).toBe(true);
    expect(fitted.lines.length * fitted.lineHeight).toBeLessThanOrEqual(400);
  });
});

describe("buildFooterText", () => {
  it("links builtin decks to their landing page", () => {
    expect(buildFooterText("first-date")).toBe(
      "unravel.tiagocostadev.com/decks/first-date"
    );
  });

  it("shows only the site for custom and favourites decks", () => {
    expect(buildFooterText("custom-abc123")).toBe("unravel.tiagocostadev.com");
    expect(buildFooterText("favourites")).toBe("unravel.tiagocostadev.com");
  });
});

describe("buildShareFileName", () => {
  it("names the file after the deck", () => {
    expect(buildShareFileName("first-date")).toBe("unravel-first-date.png");
  });
});

describe("hexToRgba", () => {
  it("converts six and three digit hex colours", () => {
    expect(hexToRgba("#eebbc3", 0.5, "#000000")).toBe(
      "rgba(238, 187, 195, 0.5)"
    );
    expect(hexToRgba("#fff", 1, "#000000")).toBe("rgba(255, 255, 255, 1)");
  });

  it("falls back when the colour is invalid", () => {
    expect(hexToRgba("coral", 0.2, "#000000")).toBe("rgba(0, 0, 0, 0.2)");
  });
});
