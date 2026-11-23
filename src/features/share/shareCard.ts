import type { Locale } from "../../content/types";
import { shareCopy } from "./copy";
import { downloadBlob } from "./downloadBlob";
import { drawShareCard } from "./drawShareCard";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  buildShareFileName,
} from "./shareLayout";

export interface ShareCardInput {
  cardText: string;
  deckTitle: string;
  deckId: string;
  accent: string;
  locale: Locale;
  /** One line shown with the image in the share sheet. */
  shareText: string;
  /** The deck page the share points to. */
  shareUrl: string;
}

export type ShareCardResult = "shared" | "downloaded" | "cancelled";

const FONT_LOAD_TIMEOUT_MILLISECONDS = 1500;

/** Waits for both canvas fonts. A font failure or a slow network never blocks sharing.
 *  The real text is passed so browsers also fetch the subsets (such as latin-ext) it needs. */
const loadCanvasFonts = async (input: ShareCardInput): Promise<void> => {
  if (typeof document === "undefined" || !document.fonts) return;
  const interfaceText = `${shareCopy[input.locale].wordmark} ${input.deckTitle}`;
  const fontsLoaded = Promise.all([
    document.fonts.load('700 48px "Figtree Variable"', interfaceText),
    document.fonts.load('48px "Young Serif"', input.cardText),
  ]).then(
    () => undefined,
    () => undefined
  );
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, FONT_LOAD_TIMEOUT_MILLISECONDS);
  });
  try {
    await Promise.race([fontsLoaded, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const renderCardBlob = async (input: ShareCardInput): Promise<Blob> => {
  const copy = shareCopy[input.locale];
  await loadCanvasFonts(input);
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(copy.canvasUnavailable);
  drawShareCard(context, input);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(copy.imageEncodingFailed));
    }, "image/png");
  });
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : (error as { name?: string } | null)?.name === "AbortError";

/** Opens the share sheet with the image, a line of text and the deck link. A browser or
 *  app that refuses the extra fields gets the image alone. Returns undefined when file
 *  sharing is unavailable. */
const tryShareFile = async (
  file: File,
  input: ShareCardInput
): Promise<"shared" | "cancelled" | undefined> => {
  if (
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return undefined;
  }
  const attempts: ShareData[] = [
    {
      files: [file],
      title: input.deckTitle,
      text: input.shareText,
      url: input.shareUrl,
    },
    { files: [file], title: input.deckTitle },
  ];
  for (const data of attempts) {
    if (!navigator.canShare(data)) continue;
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
      // Refused: try the image alone, then fall back to a download.
    }
  }
  return undefined;
};

/** Renders a 1080x1920 PNG and shares it, or downloads it when sharing files is unavailable. */
export const shareCardImage = async (
  input: ShareCardInput
): Promise<ShareCardResult> => {
  const blob = await renderCardBlob(input);
  const fileName = buildShareFileName(input.deckId);
  const file = new File([blob], fileName, { type: "image/png" });
  const shareResult = await tryShareFile(file, input);
  if (shareResult) return shareResult;
  downloadBlob(blob, fileName);
  return "downloaded";
};
