import { useEffect, useState } from "react";
import type { Card, Deck } from "../../../content/types";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { buildDeckShareUrl } from "../../share/deckShareUrl";
import { shareCardImage } from "../../share/shareCard";
import { playCopy } from "../copy";

const STATUS_VISIBLE_MILLISECONDS = 2800;

/**
 * Shares the card as an image and keeps a short status line: "Shared",
 * "Image saved", or the reason it failed. A cancelled share says nothing.
 */
export function useShareCard(deck: Deck) {
  const copy = useCopy(playCopy).card;
  const locale = useLocale();
  const [isSharing, setIsSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (statusMessage === null) return;
    const timer = window.setTimeout(
      () => setStatusMessage(null),
      STATUS_VISIBLE_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const shareCard = async (card: Card) => {
    if (isSharing) return;
    setIsSharing(true);
    setStatusMessage(null);
    try {
      const deckTitle = localize(deck.title, locale);
      const result = await shareCardImage({
        cardText: localize(card.text, locale),
        deckTitle,
        deckId: deck.id,
        accent: deck.accent,
        locale,
        shareText: formatCopy(copy.shareText, { deck: deckTitle }),
        shareUrl: buildDeckShareUrl(deck.id, window.location.origin),
      });
      if (result === "shared") setStatusMessage(copy.shared);
      if (result === "downloaded") setStatusMessage(copy.imageSaved);
    } catch (error) {
      // shareCardImage rejects with a localized message that names the cause.
      setStatusMessage(
        error instanceof Error && error.message
          ? error.message
          : copy.shareFailed
      );
    } finally {
      setIsSharing(false);
    }
  };

  return { shareCard, isSharing, statusMessage };
}
