import { useId, type CSSProperties } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiGrid, FiShuffle, FiStar } from "react-icons/fi";
import { DeckIcon } from "../../../components/DeckIcon";
import type { Deck } from "../../../content/types";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import { flowCopy } from "../flowCopy";
import "./DeckEndActions.scss";

interface DeckEndActionsProps {
  suggestedDeck: Deck | undefined;
  hasFavourites: boolean;
  /** Missing when the deck's cards are gone (all stars removed, custom deck deleted). */
  onPlayAgain?: () => void;
}

/** The next steps after a finished deck: a suggested deck, one more round, or back to the decks. */
export const DeckEndActions = ({
  suggestedDeck,
  hasFavourites,
  onPlayAgain,
}: DeckEndActionsProps) => {
  const copy = useCopy(playCopy);
  const flow = useCopy(flowCopy).end;
  const locale = useLocale();
  const upNextTitleId = useId();
  const replayNoteId = useId();

  return (
    <>
      {suggestedDeck && (
        <section
          className="deck-end-next"
          aria-labelledby={upNextTitleId}
          style={{ "--deck-accent": suggestedDeck.accent } as CSSProperties}
        >
          <h2 id={upNextTitleId} className="deck-end-next__eyebrow">
            {flow.upNextTitle}
          </h2>
          <div className="deck-end-next__deck">
            <span className="deck-end-next__icon" aria-hidden="true">
              <DeckIcon name={suggestedDeck.icon} size={22} />
            </span>
            <div className="deck-end-next__text">
              <p className="deck-end-next__name">
                {localize(suggestedDeck.title, locale)}
              </p>
              <p className="deck-end-next__description">
                {localize(suggestedDeck.description, locale)}
              </p>
            </div>
          </div>
          <Link
            to={`/play/${encodeURIComponent(suggestedDeck.id)}`}
            viewTransition
            className="button button--primary"
          >
            {formatCopy(copy.end.tryDeck, {
              deck: localize(suggestedDeck.title, locale),
            })}
            <FiArrowRight aria-hidden="true" size={20} />
          </Link>
        </section>
      )}
      <div className="deck-end__actions">
        {onPlayAgain && (
          <button
            type="button"
            className={`button ${suggestedDeck ? "button--secondary" : "button--primary"}`}
            aria-describedby={replayNoteId}
            onClick={onPlayAgain}
          >
            <FiShuffle aria-hidden="true" size={20} />
            {copy.end.playAgainShuffled}
          </button>
        )}
        {onPlayAgain && (
          <p id={replayNoteId} className="deck-end__replay-note">
            {flow.replayBody}
          </p>
        )}
        {hasFavourites && (
          <Link
            to="/play/favourites"
            viewTransition
            className="button button--secondary"
          >
            <FiStar aria-hidden="true" size={20} />
            {copy.end.seeFavourites}
          </Link>
        )}
        <Link
          to="/decks"
          viewTransition
          className={`button ${suggestedDeck || onPlayAgain ? "button--quiet" : "button--primary"}`}
        >
          <FiGrid aria-hidden="true" size={20} />
          {copy.backToDecks}
        </Link>
      </div>
    </>
  );
};

export default DeckEndActions;
