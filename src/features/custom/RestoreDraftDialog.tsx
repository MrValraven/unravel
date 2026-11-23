import { useRef } from "react";
import { Dialog } from "../../components/Dialog";
import { useCopy } from "../../i18n/useCopy";
import { customCopy } from "./copy";

interface RestoreDraftDialogProps {
  isOpen: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}

/** Offered on arrival when edits from an earlier visit were autosaved. */
export const RestoreDraftDialog = ({
  isOpen,
  onRestore,
  onDiscard,
}: RestoreDraftDialogProps) => {
  const dialogCopy = useCopy(customCopy).editor.restoreDialog;
  const restoreButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      isOpen={isOpen}
      // Closing without a choice keeps the edits: restoring loses nothing, discarding does.
      onClose={onRestore}
      title={dialogCopy.title}
      description={dialogCopy.description}
      initialFocusRef={restoreButtonRef}
      footer={
        <>
          <button
            type="button"
            className="button button--secondary"
            onClick={onDiscard}
          >
            {dialogCopy.discard}
          </button>
          <button
            ref={restoreButtonRef}
            type="button"
            className="button button--primary"
            onClick={onRestore}
          >
            {dialogCopy.restore}
          </button>
        </>
      }
    />
  );
};

export default RestoreDraftDialog;
