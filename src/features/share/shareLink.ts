export interface ShareLinkInput {
  title?: string;
  text?: string;
  url: string;
  /** What the clipboard gets when there is no share sheet. Defaults to the url. */
  clipboardText?: string;
}

export type ShareLinkOutcome =
  "shared" | "copied" | "cancelled" | "unavailable";

const isAbortError = (error: unknown): boolean =>
  (error as { name?: string } | null)?.name === "AbortError";

/**
 * Opens the share sheet where there is one, else copies to the clipboard. Closing
 * the share sheet is not an error, so it reports "cancelled" and copies nothing.
 * "unavailable" means both failed: the caller shows the link so it can be copied by hand.
 */
export const shareLink = async ({
  title,
  text,
  url,
  clipboardText,
}: ShareLinkInput): Promise<ShareLinkOutcome> => {
  if (typeof navigator.share === "function") {
    const data: ShareData = { url };
    if (title !== undefined) data.title = title;
    if (text !== undefined) data.text = text;
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
      // Refused (no permission, unsupported data): the clipboard still works.
    }
  }
  try {
    await navigator.clipboard.writeText(clipboardText ?? url);
    return "copied";
  } catch {
    return "unavailable";
  }
};
