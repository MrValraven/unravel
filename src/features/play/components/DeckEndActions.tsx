import { Link } from "react-router";
import { FiArrowRight, FiGrid, FiShuffle, FiStar } from "react-icons/fi";
import type { Deck } from "../../../content/types";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";

interface DeckEndActionsProps {
  suggestedDeck: Deck | undefined;
  hasFavourites: boolean;
  /** Missing when the deck's cards are gone (all stars removed, custom deck deleted). */
  onPlayAgain?: () => void;
}

/** The next steps after a finished deck. */
export const DeckEndActions = ({
  suggestedDeck,
  hasFavourites,
  onPlayAgain,
}: DeckEndActionsProps) => {
  const copy = useCopy(playCopy);
  const locale = useLocale();

  return (
    <div className="deck-end__actions">
      {suggestedDeck && (
        <Link
          to={`/play/${encodeURIComponent(suggestedDeck.id)}`}
          className="button button--primary"
        >
          {formatCopy(copy.end.tryDeck, {
            deck: localize(suggestedDeck.title, locale),
          })}
          <FiArrowRight aria-hidden="true" size={20} />
        </Link>
      )}
      {onPlayAgain && (
        <button
          type="button"
          className={`button ${suggestedDeck ? "button--secondary" : "button--primary"}`}
          onClick={onPlayAgain}
        >
          <FiShuffle aria-hidden="true" size={20} />
          {copy.end.playAgainShuffled}
        </button>
      )}
      {hasFavourites && (
        <Link to="/play/favourites" className="button button--secondary">
          <FiStar aria-hidden="true" size={20} />
          {copy.end.seeFavourites}
        </Link>
      )}
      <Link
        to="/decks"
        className={`button ${suggestedDeck || onPlayAgain ? "button--quiet" : "button--primary"}`}
      >
        <FiGrid aria-hidden="true" size={20} />
        {copy.backToDecks}
      </Link>
    </div>
  );
};

export default DeckEndActions;
