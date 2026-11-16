import { useId, type CSSProperties } from "react";
import { Link } from "react-router";
import { FiArrowRight } from "react-icons/fi";
import { DeckIcon } from "../../../components/DeckIcon";
import type { Deck } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { DeckBadges } from "./DeckBadges";
import "./DeckCard.scss";

interface DeckCardBaseProps {
  deck: Deck;
  /** Heading level of the title, so the tile fits the page outline. */
  headingLevel?: "h2" | "h3";
}

interface DeckCardButtonProps extends DeckCardBaseProps {
  /** Opens the preview sheet. */
  onSelect: (deck: Deck) => void;
  to?: never;
}

interface DeckCardLinkProps extends DeckCardBaseProps {
  /** Goes to this route instead, for example the deck page. */
  to: string;
  onSelect?: never;
}

type DeckCardProps = DeckCardButtonProps | DeckCardLinkProps;

/**
 * A deck as a small physical box: the deck tone fills the face, the title is
 * set in the card serif and a second card edge peeks out underneath.
 * The control holds only the title, so its accessible name matches its visible
 * text; its overlay stretches over the whole tile so every part is clickable.
 * The tagline and badges sit outside it and describe it.
 */
export const DeckCard = ({
  deck,
  onSelect,
  to,
  headingLevel = "h3",
}: DeckCardProps) => {
  const Heading = headingLevel;
  const locale = useLocale();
  const taglineId = useId();
  const badgesId = useId();
  const title = localize(deck.title, locale);
  // Favourites and custom decks have no tagline; their descriptions are one short line.
  const tagline = localize(deck.tagline ?? deck.description, locale);
  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;
  const describedBy = `${taglineId} ${badgesId}`;

  return (
    <div className="deck-card" style={accentStyle}>
      <div className="deck-card__top">
        <DeckIcon name={deck.icon} size={24} className="deck-card__icon" />
        <FiArrowRight
          className="deck-card__arrow"
          aria-hidden="true"
          size={18}
        />
      </div>
      <Heading className="deck-card__title">
        {to === undefined ? (
          <button
            type="button"
            className="deck-card__control"
            aria-describedby={describedBy}
            onClick={() => onSelect(deck)}
          >
            {title}
          </button>
        ) : (
          <Link
            to={to}
            viewTransition
            className="deck-card__control"
            aria-describedby={describedBy}
          >
            {title}
          </Link>
        )}
      </Heading>
      <p id={taglineId} className="deck-card__tagline">
        {tagline}
      </p>
      <DeckBadges
        id={badgesId}
        deck={deck}
        cardCount={deck.cards.length}
        isOnTone
      />
    </div>
  );
};

export default DeckCard;
