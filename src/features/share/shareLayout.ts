import { CUSTOM_DECK_PREFIX, FAVOURITES_DECK_ID } from "../../content/types";

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;
export const SHARE_CARD_SITE_HOST = "unravel.tiagocostadev.com";

/** Measures the width in pixels of one line of text at the font size in use. */
export type MeasureLine = (text: string) => number;
/** Measures the width in pixels of one line of text at the given font size. */
export type MeasureLineAtSize = (text: string, fontSize: number) => number;

/** Greedy word wrap. A single word wider than the line is split by character. */
export const wrapText = (
  text: string,
  maxWidth: number,
  measureLine: MeasureLine
): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let currentLine = "";
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (measureLine(candidate) <= maxWidth) {
        currentLine = candidate;
        continue;
      }
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      let remainingWord = word;
      while (
        measureLine(remainingWord) > maxWidth &&
        remainingWord.length > 1
      ) {
        let splitLength = remainingWord.length - 1;
        while (
          splitLength > 1 &&
          measureLine(remainingWord.slice(0, splitLength)) > maxWidth
        ) {
          splitLength -= 1;
        }
        lines.push(remainingWord.slice(0, splitLength));
        remainingWord = remainingWord.slice(splitLength);
      }
      currentLine = remainingWord;
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
};

export interface FitFontSizeOptions {
  text: string;
  maxWidth: number;
  maxHeight: number;
  maxFontSize: number;
  minFontSize: number;
  /** Line height as a multiple of the font size. */
  lineHeightRatio: number;
  measureText: MeasureLineAtSize;
  /** Font size decrement per attempt. Defaults to 2. */
  step?: number;
}

export interface FittedText {
  fontSize: number;
  lineHeight: number;
  lines: string[];
  /** True when the text still overflowed at the minimum size and lines were cut. */
  isTruncated: boolean;
}

/** Largest font size in [minFontSize, maxFontSize] where the wrapped text fits the box. */
export const fitFontSize = ({
  text,
  maxWidth,
  maxHeight,
  maxFontSize,
  minFontSize,
  lineHeightRatio,
  measureText,
  step = 2,
}: FitFontSizeOptions): FittedText => {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= step) {
    const lines = wrapText(text, maxWidth, (line) =>
      measureText(line, fontSize)
    );
    const lineHeight = fontSize * lineHeightRatio;
    if (lines.length * lineHeight <= maxHeight) {
      return { fontSize, lineHeight, lines, isTruncated: false };
    }
  }
  const lines = wrapText(text, maxWidth, (line) =>
    measureText(line, minFontSize)
  );
  const lineHeight = minFontSize * lineHeightRatio;
  const maxLineCount = Math.max(1, Math.floor(maxHeight / lineHeight));
  if (lines.length <= maxLineCount) {
    return { fontSize: minFontSize, lineHeight, lines, isTruncated: false };
  }
  const keptLines = lines.slice(0, maxLineCount);
  let lastLine = keptLines[maxLineCount - 1] ?? "";
  while (
    lastLine.length > 1 &&
    measureText(`${lastLine}…`, minFontSize) > maxWidth
  ) {
    lastLine = lastLine.slice(0, -1);
  }
  keptLines[maxLineCount - 1] = `${lastLine.trimEnd()}…`;
  return {
    fontSize: minFontSize,
    lineHeight,
    lines: keptLines,
    isTruncated: true,
  };
};

/** Footer line of the image. Custom and favourites decks have no public page. */
export const buildFooterText = (deckId: string): string => {
  const hasPublicPage =
    deckId !== FAVOURITES_DECK_ID && !deckId.startsWith(CUSTOM_DECK_PREFIX);
  return hasPublicPage
    ? `${SHARE_CARD_SITE_HOST}/decks/${deckId}`
    : SHARE_CARD_SITE_HOST;
};

export const buildShareFileName = (deckId: string): string =>
  `unravel-${deckId}.png`;

/** "#rrggbb" or "#rgb" to an rgba() string. Invalid input falls back to the fallback colour. */
export const hexToRgba = (
  hex: string,
  alpha: number,
  fallbackHex: string
): string => {
  const parse = (value: string): [number, number, number] | undefined => {
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
    const matchedDigits = match?.[1];
    if (!matchedDigits) return undefined;
    const digits =
      matchedDigits.length === 3
        ? matchedDigits
            .split("")
            .map((digit) => digit + digit)
            .join("")
        : matchedDigits;
    return [
      parseInt(digits.slice(0, 2), 16),
      parseInt(digits.slice(2, 4), 16),
      parseInt(digits.slice(4, 6), 16),
    ];
  };
  const [red, green, blue] = parse(hex) ??
    parse(fallbackHex) ?? [238, 187, 195];
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};
