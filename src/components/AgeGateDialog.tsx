import { useRef } from "react";
import { useCopy } from "../i18n/useCopy";
import { formatCopy } from "../i18n/localize";
import { confirmAge } from "../storage/ageGate";
import { Dialog } from "./Dialog";
import { sharedCopy } from "./copy";

export interface AgeGateDialogProps {
  isOpen: boolean;
  deckTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks for 18+ confirmation and stores it before calling onConfirm. */
export const AgeGateDialog = ({
  isOpen,
  deckTitle,
  onConfirm,
  onCancel,
}: AgeGateDialogProps) => {
  const copy = useCopy(sharedCopy).ageGate;
  // Focus starts on the safe choice so a stray Enter never confirms.
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    confirmAge();
    onConfirm();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      title={copy.title}
      description={formatCopy(copy.description, { deck: deckTitle })}
      initialFocusRef={cancelButtonRef}
      footer={
        <>
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button--secondary"
            onClick={onCancel}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={handleConfirm}
          >
            {copy.confirm}
          </button>
        </>
      }
    />
  );
};

export default AgeGateDialog;
