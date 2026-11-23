import type { MouseEvent } from "react";
import { Link } from "react-router";
import { FiEdit2, FiPlay, FiShare2, FiTrash2 } from "react-icons/fi";
import { DeckIcon } from "../../components/DeckIcon";
import { formatCopy, pluralize } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import type { CustomDeck } from "../../storage/customDecks";
import { customCopy } from "./copy";
import { useLeaveAnimation } from "./useLeaveAnimation";
import "./CustomDeckListItem.scss";

interface CustomDeckListItemProps {
  deck: CustomDeck;
  /** True while the item animates out after a confirmed delete. */
  isLeaving: boolean;
  onLeft: (deck: CustomDeck) => void;
  onStart: (deck: CustomDeck) => void;
  onShare: (deck: CustomDeck) => void;
  onDelete: (deck: CustomDeck) => void;
}

export const CustomDeckListItem = ({
  deck,
  isLeaving,
  onLeft,
  onStart,
  onShare,
  onDelete,
}: CustomDeckListItemProps) => {
  const copy = useCopy(customCopy);
  const listCopy = copy.list;
  const handleAnimationEnd = useLeaveAnimation(isLeaving, () => onLeft(deck));
  const nameAction = (template: string) =>
    formatCopy(template, { title: deck.title });
  const hasCards = deck.cards.length > 0;
  const encodedDeckId = encodeURIComponent(deck.id);

  // A plain click asks before replacing a saved game. Modified clicks keep the link's own behaviour.
  const handleStartClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onStart(deck);
  };

  return (
    <li
      className="custom-deck-item"
      data-state={isLeaving ? "leaving" : "visible"}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="custom-deck-item__summary">
        <span className="custom-deck-item__icon">
          <DeckIcon name="edit" size={22} />
        </span>
        <div className="custom-deck-item__text">
          <h2 className="custom-deck-item__title">{deck.title}</h2>
          <p className="custom-deck-item__count">
            {pluralize(deck.cards.length, copy.cardCount)}
          </p>
        </div>
      </div>
      <div className="custom-deck-item__actions">
        {hasCards && (
          <Link
            to={`/play/${encodedDeckId}`}
            className="button button--primary"
            viewTransition
            onClick={handleStartClick}
            aria-label={nameAction(listCopy.startDeckNamed)}
          >
            <FiPlay aria-hidden="true" size={18} />
            {listCopy.startDeck}
          </Link>
        )}
        <Link
          to={`/custom/${encodedDeckId}/edit`}
          className="button button--secondary"
          viewTransition
          aria-label={nameAction(listCopy.editDeckNamed)}
        >
          <FiEdit2 aria-hidden="true" size={18} />
          {listCopy.editDeck}
        </Link>
        {hasCards && (
          <button
            type="button"
            className="button button--secondary"
            aria-label={nameAction(listCopy.shareLinkNamed)}
            onClick={() => onShare(deck)}
          >
            <FiShare2 aria-hidden="true" size={18} />
            {listCopy.shareLink}
          </button>
        )}
        <button
          type="button"
          className="button button--quiet"
          aria-label={nameAction(listCopy.deleteDeckNamed)}
          onClick={() => onDelete(deck)}
        >
          <FiTrash2 aria-hidden="true" size={18} />
          {listCopy.deleteDeck}
        </button>
      </div>
    </li>
  );
};

export default CustomDeckListItem;
