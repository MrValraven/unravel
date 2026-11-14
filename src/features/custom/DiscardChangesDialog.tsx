import { useRef } from "react";
import { Dialog } from "../../components/Dialog";
import { useCopy } from "../../i18n/useCopy";
import { customCopy } from "./copy";

interface DiscardChangesDialogProps {
  isOpen: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export const DiscardChangesDialog = ({
  isOpen,
  onKeepEditing,
  onDiscard,
}: DiscardChangesDialogProps) => {
  const dialogCopy = useCopy(customCopy).editor.discardDialog;
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onKeepEditing}
      title={dialogCopy.title}
      description={dialogCopy.description}
      initialFocusRef={keepEditingButtonRef}
      footer={
        <>
          <button
            ref={keepEditingButtonRef}
            type="button"
            className="button button--secondary"
            onClick={onKeepEditing}
          >
            {dialogCopy.cancel}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onDiscard}
          >
            {dialogCopy.confirm}
          </button>
        </>
      }
    />
  );
};

export default DiscardChangesDialog;
