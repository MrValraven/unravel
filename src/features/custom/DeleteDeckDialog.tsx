import { useRef, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { Dialog } from "../../components/Dialog";
import { formatCopy, pluralize } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import type { CustomDeck } from "../../storage/customDecks";
import { customCopy } from "./copy";

interface DeleteDeckDialogProps {
  /** The deck waiting for confirmation, or null when the dialog is closed. */
  deck: CustomDeck | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteDeckDialog = ({
  deck,
  onConfirm,
  onCancel,
}: DeleteDeckDialogProps) => {
  const copy = useCopy(customCopy);
  const dialogCopy = copy.list.deleteDialog;
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  // Keep showing the last deck while the dialog animates out.
  const [shownDeck, setShownDeck] = useState(deck);
  if (deck && deck !== shownDeck) setShownDeck(deck);

  const title = shownDeck?.title ?? "";
  const cards = pluralize(shownDeck?.cards.length ?? 0, copy.cardCount);

  return (
    <Dialog
      isOpen={deck !== null}
      onClose={onCancel}
      title={formatCopy(dialogCopy.title, { title })}
      description={formatCopy(dialogCopy.description, { cards })}
      initialFocusRef={cancelButtonRef}
      footer={
        <>
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button--secondary"
            onClick={onCancel}
          >
            {dialogCopy.cancel}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onConfirm}
          >
            <FiTrash2 aria-hidden="true" size={18} />
            {dialogCopy.confirm}
          </button>
        </>
      }
    />
  );
};

export default DeleteDeckDialog;
