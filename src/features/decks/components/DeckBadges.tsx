import type { DeckMeta } from "../../../content/types";
import { pluralize } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { deckCopy } from "../copy";
import "./DeckBadges.scss";

interface DeckBadgesProps {
  deck: DeckMeta;
  cardCount: number;
  id?: string;
}

/** Card count, tag pill (new, beta, seasonal) and the 18+ marker. */
export const DeckBadges = ({ deck, cardCount, id }: DeckBadgesProps) => {
  const copy = useCopy(deckCopy);

  return (
    <span id={id} className="deck-badges">
      <span className="deck-badges__count">
        {pluralize(cardCount, copy.deckCard.cardCount)}
      </span>
      {deck.tag && (
        <span className={`deck-badges__pill deck-badges__pill--${deck.tag}`}>
          {copy.tags[deck.tag]}
        </span>
      )}
      {deck.isAdult && (
        <span className="deck-badges__pill deck-badges__pill--adult">
          <span aria-hidden="true">{copy.deckCard.adultsOnly}</span>
          <span className="visually-hidden">
            {copy.deckCard.adultsOnlyLabel}
          </span>
        </span>
      )}
    </span>
  );
};

export default DeckBadges;
