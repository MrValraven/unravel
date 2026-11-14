import { useId, type CSSProperties } from "react";
import { FiEye, FiPlay } from "react-icons/fi";
import { DeckIcon } from "../../../components/DeckIcon";
import type { Deck } from "../../../content/types";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { DeckBadges } from "../../decks/components/DeckBadges";
import { finderCopy } from "../copy";

interface FinderSuggestionProps {
  deck: Deck;
  onStart: (deck: Deck) => void;
  onPreview: (deck: Deck) => void;
}

export const FinderSuggestion = ({
  deck,
  onStart,
  onPreview,
}: FinderSuggestionProps) => {
  const copy = useCopy(finderCopy).results;
  const locale = useLocale();
  const titleId = useId();
  const title = localize(deck.title, locale);
  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;

  return (
    <article
      className="finder-suggestion"
      style={accentStyle}
      aria-labelledby={titleId}
    >
      <div className="finder-suggestion__identity">
        <span className="finder-suggestion__icon" aria-hidden="true">
          <DeckIcon name={deck.icon} size={24} />
        </span>
        <div className="finder-suggestion__text">
          <h3 id={titleId} className="finder-suggestion__title">
            {title}
          </h3>
          <DeckBadges deck={deck} cardCount={deck.cards.length} />
        </div>
      </div>
      <p className="finder-suggestion__description">
        {localize(deck.description, locale)}
      </p>
      <div className="finder-suggestion__actions">
        <button
          type="button"
          className="button button--secondary"
          aria-label={formatCopy(copy.previewDeckLabel, { deck: title })}
          onClick={() => onPreview(deck)}
        >
          <FiEye aria-hidden="true" size={18} />
          {copy.previewDeck}
        </button>
        <button
          type="button"
          className="button button--primary"
          aria-label={formatCopy(copy.startDeckLabel, { deck: title })}
          onClick={() => onStart(deck)}
        >
          <FiPlay aria-hidden="true" size={18} />
          {copy.startDeck}
        </button>
      </div>
    </article>
  );
};

export default FinderSuggestion;
