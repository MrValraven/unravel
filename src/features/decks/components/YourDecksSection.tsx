import { useId } from "react";
import { Link } from "react-router";
import { FiEdit2, FiPlus, FiStar } from "react-icons/fi";
import { resolveDeck, type DeckSources } from "../../../content/resolveDeck";
import { FAVOURITES_DECK_ID, type Deck } from "../../../content/types";
import { pluralize } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { MIN_FAVOURITES_FOR_DECK } from "../../../storage/favourites";
import { deckCopy } from "../copy";
import { DeckCard } from "./DeckCard";
import "./YourDecksSection.scss";

interface YourDecksSectionProps {
  sources: DeckSources;
  onSelectDeck: (deck: Deck) => void;
}

const isDeck = (candidate: Deck | undefined): candidate is Deck =>
  candidate !== undefined;

/** The favourites deck (or how many stars it still needs), custom decks, and a way to make one. */
export const YourDecksSection = ({
  sources,
  onSelectDeck,
}: YourDecksSectionProps) => {
  const copy = useCopy(deckCopy).yourDecks;
  const headingId = useId();
  // Stars on cards that no longer exist do not count, so stale ids fall back to the hint.
  const resolvedFavouritesDeck = resolveDeck(FAVOURITES_DECK_ID, sources);
  const playableFavouriteCount = resolvedFavouritesDeck?.cards.length ?? 0;
  const favouritesDeck =
    playableFavouriteCount >= MIN_FAVOURITES_FOR_DECK
      ? resolvedFavouritesDeck
      : undefined;
  const missingFavouriteCount =
    MIN_FAVOURITES_FOR_DECK - playableFavouriteCount;
  const customDecks = sources.customDecks
    .map((customDeck) => resolveDeck(customDeck.id, sources))
    .filter(isDeck);

  return (
    <section className="your-decks" aria-labelledby={headingId}>
      <h2 id={headingId} className="deck-section-title">
        {copy.title}
      </h2>
      <ul className="your-decks__list" role="list">
        {favouritesDeck ? (
          <li>
            <DeckCard deck={favouritesDeck} onSelect={onSelectDeck} />
          </li>
        ) : (
          <li className="your-decks__hint">
            <FiStar
              aria-hidden="true"
              size={20}
              className="your-decks__hint-icon"
            />
            <p>{pluralize(missingFavouriteCount, copy.favouritesHint)}</p>
          </li>
        )}
        {customDecks.map((customDeck) => (
          <li key={customDeck.id}>
            <DeckCard deck={customDeck} onSelect={onSelectDeck} />
          </li>
        ))}
      </ul>
      <div className="your-decks__actions">
        <Link
          to="/custom/new"
          viewTransition
          className="button button--secondary"
        >
          <FiPlus aria-hidden="true" size={18} />
          {copy.createDeck}
        </Link>
        {customDecks.length > 0 && (
          <Link to="/custom" viewTransition className="button button--quiet">
            <FiEdit2 aria-hidden="true" size={18} />
            {copy.manageDecks}
          </Link>
        )}
      </div>
    </section>
  );
};

export default YourDecksSection;
