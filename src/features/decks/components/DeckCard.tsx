import { useId, type CSSProperties } from "react";
import { FiChevronRight } from "react-icons/fi";
import { DeckIcon } from "../../../components/DeckIcon";
import type { Deck } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { DeckBadges } from "./DeckBadges";
import "./DeckCard.scss";

interface DeckCardProps {
  deck: Deck;
  onSelect: (deck: Deck) => void;
  /** Hides the description, for short lists such as finder results. */
  isCompact?: boolean;
}

/**
 * A deck in a list: icon in the deck tone, title, description and badges. Opens the preview.
 * The button holds only the title, so its accessible name matches its visible text;
 * its overlay stretches over the whole card to keep every part of the card clickable.
 * The description and badges stay outside the button and describe it.
 */
export const DeckCard = ({
  deck,
  onSelect,
  isCompact = false,
}: DeckCardProps) => {
  const locale = useLocale();
  const descriptionId = useId();
  const badgesId = useId();
  const title = localize(deck.title, locale);
  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;
  const describedByIds = isCompact ? badgesId : `${descriptionId} ${badgesId}`;

  return (
    <div className="deck-card" style={accentStyle}>
      <span className="deck-card__icon" aria-hidden="true">
        <DeckIcon name={deck.icon} size={22} />
      </span>
      <div className="deck-card__body">
        <h3 className="deck-card__title">
          <button
            type="button"
            className="deck-card__button"
            aria-describedby={describedByIds}
            onClick={() => onSelect(deck)}
          >
            {title}
          </button>
        </h3>
        {!isCompact && (
          <p id={descriptionId} className="deck-card__description">
            {localize(deck.description, locale)}
          </p>
        )}
        <DeckBadges id={badgesId} deck={deck} cardCount={deck.cards.length} />
      </div>
      <FiChevronRight
        className="deck-card__chevron"
        aria-hidden="true"
        size={20}
      />
    </div>
  );
};

export default DeckCard;
