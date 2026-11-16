import { useId } from "react";
import { Link } from "react-router";
import { FiPlus } from "react-icons/fi";
import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { MIN_FAVOURITES_FOR_DECK } from "../../../storage/favourites";
import { deckCopy } from "../copy";
import "./MakeOwnDeckRow.scss";

/**
 * The compact stand-in for "Your decks" while the player has no favourites
 * and no custom decks. It sits below the catalogue, so first visits open on decks.
 */
export const MakeOwnDeckRow = () => {
  const copy = useCopy(deckCopy).makeOwnDeck;
  const headingId = useId();

  return (
    <section className="make-own-deck" aria-labelledby={headingId}>
      <div className="make-own-deck__text">
        <h2 id={headingId} className="make-own-deck__title">
          {copy.title}
        </h2>
        <p className="make-own-deck__body">
          {formatCopy(copy.body, { count: MIN_FAVOURITES_FOR_DECK })}
        </p>
      </div>
      <Link
        to="/custom/new"
        viewTransition
        className="button button--secondary make-own-deck__action"
      >
        <FiPlus aria-hidden="true" size={18} />
        {copy.action}
      </Link>
    </section>
  );
};

export default MakeOwnDeckRow;
