import { useId } from "react";
import { Link } from "react-router";
import { FiPlus } from "react-icons/fi";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { MAX_CUSTOM_DECKS } from "../../storage/customDecks";
import { customCopy } from "./copy";

interface CreateDeckActionProps {
  canCreate: boolean;
  /** With decks listed, each deck's Start button is the primary action, so Create steps back. */
  hasDecks: boolean;
  /** Called when the player presses Create while the deck limit is reached. */
  onLimitReached: (reason: string) => void;
}

/**
 * "Create a deck". At the deck limit it stays focusable, says why it is unavailable
 * and repeats the reason as a status notice when pressed.
 */
export const CreateDeckAction = ({
  canCreate,
  hasDecks,
  onLimitReached,
}: CreateDeckActionProps) => {
  const copy = useCopy(customCopy);
  const limitNoteId = useId();
  const limitReason = formatCopy(copy.deckLimit, { max: MAX_CUSTOM_DECKS });
  const className = `button ${hasDecks ? "button--secondary" : "button--primary"} custom-decks__create`;

  if (canCreate) {
    return (
      <Link to="/custom/new" className={className}>
        <FiPlus aria-hidden="true" size={20} />
        {copy.list.createDeck}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-disabled="true"
        aria-describedby={limitNoteId}
        onClick={() => onLimitReached(limitReason)}
      >
        <FiPlus aria-hidden="true" size={20} />
        {copy.list.createDeck}
      </button>
      <p id={limitNoteId} className="custom-decks__limit-note">
        {limitReason}
      </p>
    </>
  );
};

export default CreateDeckAction;
