import { useState } from "react";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import type { CustomDeck } from "../../storage/customDecks";
import { LONG_LINK_WARNING_LENGTH, buildShareUrl } from "./codec";
import { customCopy } from "./copy";

export interface PendingLongLink {
  title: string;
  url: string;
}

const isShareCancelled = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

/**
 * Shares a deck as a link: the native share sheet when the browser has one, otherwise
 * the clipboard with a status notice. Links past LONG_LINK_WARNING_LENGTH wait for the
 * player to confirm in a dialog first.
 */
export const useShareDeck = (showStatus: (text: string) => void) => {
  const copy = useCopy(customCopy).share;
  const [pendingLongLink, setPendingLongLink] =
    useState<PendingLongLink | null>(null);

  const copyLink = async ({ title, url }: PendingLongLink) => {
    if (typeof navigator.clipboard?.writeText !== "function") {
      showStatus(copy.clipboardUnavailable);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showStatus(formatCopy(copy.linkCopied, { title }));
    } catch {
      showStatus(copy.clipboardBlocked);
    }
  };

  const deliverLink = async (link: PendingLongLink) => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: link.title, url: link.url });
        return;
      } catch (error) {
        if (isShareCancelled(error)) return;
        // The share sheet refused this link, so copying it is the next best thing.
      }
    }
    await copyLink(link);
  };

  const requestShare = (deck: CustomDeck) => {
    const link: PendingLongLink = {
      title: deck.title,
      url: buildShareUrl(
        {
          title: deck.title,
          cards: deck.cards.map(({ type, text }) => ({ type, text })),
        },
        window.location.origin
      ),
    };
    if (link.url.length > LONG_LINK_WARNING_LENGTH) {
      setPendingLongLink(link);
      return;
    }
    void deliverLink(link);
  };

  const confirmLongLink = () => {
    if (!pendingLongLink) return;
    setPendingLongLink(null);
    void deliverLink(pendingLongLink);
  };

  const cancelLongLink = () => setPendingLongLink(null);

  return { requestShare, pendingLongLink, confirmLongLink, cancelLongLink };
};
