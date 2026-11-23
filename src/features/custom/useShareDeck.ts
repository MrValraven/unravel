import { useState } from "react";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import type { CustomDeck } from "../../storage/customDecks";
import { shareLink } from "../share/shareLink";
import { LONG_LINK_WARNING_LENGTH, buildShareUrl } from "./codec";
import { customCopy } from "./copy";

export interface PendingLongLink {
  title: string;
  url: string;
}

/**
 * Shares a deck as a link: the native share sheet when the browser has one, otherwise
 * the clipboard with a status notice, otherwise `fallbackUrl` for the page to show in a
 * field. Links past LONG_LINK_WARNING_LENGTH wait for the player to confirm in a dialog first.
 */
export const useShareDeck = (showStatus: (text: string) => void) => {
  const copy = useCopy(customCopy).share;
  const [pendingLongLink, setPendingLongLink] =
    useState<PendingLongLink | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const deliverLink = async ({ title, url }: PendingLongLink) => {
    const outcome = await shareLink({ title, url });
    if (outcome === "copied") {
      showStatus(formatCopy(copy.linkCopied, { title }));
    } else if (outcome === "unavailable") {
      setFallbackUrl(url);
    }
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

  const closeFallback = () => setFallbackUrl(null);

  return {
    requestShare,
    pendingLongLink,
    confirmLongLink,
    cancelLongLink,
    fallbackUrl,
    closeFallback,
  };
};
