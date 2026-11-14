import type { ShareCardInput } from "./shareCard";
import { shareCopy } from "./copy";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  buildFooterText,
  fitFontSize,
  hexToRgba,
} from "./shareLayout";

const COLOR_BACKGROUND = "#232946";
const COLOR_HEADING = "#fffffe";
const COLOR_TEXT = "#b8c1ec";
const COLOR_ACCENT_FALLBACK = "#eebbc3";

const FONT_UI = '"Figtree Variable", system-ui, sans-serif';
const FONT_CARD = '"Young Serif", Georgia, serif';

const PADDING_X = 96;
const CONTENT_WIDTH = SHARE_CARD_WIDTH - PADDING_X * 2;
const WORDMARK_BASELINE_Y = 180;
const DECK_TITLE_BASELINE_Y = 268;
const CARD_TEXT_TOP = 420;
const CARD_TEXT_BOTTOM = 1560;
const FOOTER_RULE_Y = 1716;
const FOOTER_BASELINE_Y = 1800;
const MAX_CARD_FONT_SIZE = 104;
const MIN_CARD_FONT_SIZE = 48;
const CARD_LINE_HEIGHT_RATIO = 1.28;
const DECK_TITLE_FONT_SIZE = 44;

const drawBackground = (context: CanvasRenderingContext2D, accent: string) => {
  context.fillStyle = COLOR_BACKGROUND;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const topGlow = context.createRadialGradient(
    SHARE_CARD_WIDTH * 0.85,
    0,
    0,
    SHARE_CARD_WIDTH * 0.85,
    0,
    SHARE_CARD_HEIGHT * 0.6
  );
  topGlow.addColorStop(0, hexToRgba(accent, 0.34, COLOR_ACCENT_FALLBACK));
  topGlow.addColorStop(1, hexToRgba(accent, 0, COLOR_ACCENT_FALLBACK));
  context.fillStyle = topGlow;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const bottomGlow = context.createRadialGradient(
    0,
    SHARE_CARD_HEIGHT,
    0,
    0,
    SHARE_CARD_HEIGHT,
    SHARE_CARD_HEIGHT * 0.5
  );
  bottomGlow.addColorStop(0, hexToRgba(accent, 0.18, COLOR_ACCENT_FALLBACK));
  bottomGlow.addColorStop(1, hexToRgba(accent, 0, COLOR_ACCENT_FALLBACK));
  context.fillStyle = bottomGlow;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
};

/** Paints the 1080x1920 share image. Fonts must already be loaded. */
export const drawShareCard = (
  context: CanvasRenderingContext2D,
  input: ShareCardInput
): void => {
  const copy = shareCopy[input.locale];
  const accentColor = hexToRgba(input.accent, 1, COLOR_ACCENT_FALLBACK);
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  (context as { lang?: string }).lang = input.locale === "pt" ? "pt-PT" : "en";

  drawBackground(context, input.accent);

  context.fillStyle = COLOR_HEADING;
  context.font = `700 64px ${FONT_UI}`;
  context.fillText(copy.wordmark, PADDING_X, WORDMARK_BASELINE_Y);

  const deckTitleFit = fitFontSize({
    text: input.deckTitle,
    maxWidth: CONTENT_WIDTH,
    maxHeight: DECK_TITLE_FONT_SIZE * 1.3,
    maxFontSize: DECK_TITLE_FONT_SIZE,
    minFontSize: 28,
    lineHeightRatio: 1.3,
    measureText: (text, fontSize) => {
      context.font = `600 ${fontSize}px ${FONT_UI}`;
      return context.measureText(text).width;
    },
  });
  context.fillStyle = accentColor;
  context.font = `600 ${deckTitleFit.fontSize}px ${FONT_UI}`;
  context.fillText(
    deckTitleFit.lines[0] ?? "",
    PADDING_X,
    DECK_TITLE_BASELINE_Y
  );

  const cardTextFit = fitFontSize({
    text: input.cardText,
    maxWidth: CONTENT_WIDTH,
    maxHeight: CARD_TEXT_BOTTOM - CARD_TEXT_TOP,
    maxFontSize: MAX_CARD_FONT_SIZE,
    minFontSize: MIN_CARD_FONT_SIZE,
    lineHeightRatio: CARD_LINE_HEIGHT_RATIO,
    measureText: (text, fontSize) => {
      context.font = `${fontSize}px ${FONT_CARD}`;
      return context.measureText(text).width;
    },
  });
  const textBlockHeight = cardTextFit.lines.length * cardTextFit.lineHeight;
  const availableHeight = CARD_TEXT_BOTTOM - CARD_TEXT_TOP;
  const blockTop = CARD_TEXT_TOP + (availableHeight - textBlockHeight) / 2;

  context.fillStyle = accentColor;
  context.fillRect(PADDING_X, blockTop - 56, 96, 8);

  context.fillStyle = COLOR_HEADING;
  context.font = `${cardTextFit.fontSize}px ${FONT_CARD}`;
  cardTextFit.lines.forEach((line, lineIndex) => {
    const baselineY =
      blockTop + lineIndex * cardTextFit.lineHeight + cardTextFit.fontSize;
    context.fillText(line, PADDING_X, baselineY);
  });

  context.fillStyle = hexToRgba(COLOR_TEXT, 0.3, COLOR_TEXT);
  context.fillRect(PADDING_X, FOOTER_RULE_Y, CONTENT_WIDTH, 2);
  context.fillStyle = COLOR_TEXT;
  context.font = `500 36px ${FONT_UI}`;
  context.fillText(buildFooterText(input.deckId), PADDING_X, FOOTER_BASELINE_Y);
};
