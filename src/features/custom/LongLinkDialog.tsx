import { useRef, useState } from "react";
import { FiShare2 } from "react-icons/fi";
import { Dialog } from "../../components/Dialog";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { LONG_LINK_WARNING_LENGTH } from "./codec";
import { customCopy } from "./copy";
import type { PendingLongLink } from "./useShareDeck";

interface LongLinkDialogProps {
  pendingLongLink: PendingLongLink | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Warns before sharing a link long enough that messaging apps may cut it. */
export const LongLinkDialog = ({
  pendingLongLink,
  onConfirm,
  onCancel,
}: LongLinkDialogProps) => {
  const copy = useCopy(customCopy).share;
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  // Keep showing the last link while the dialog animates out.
  const [shownLink, setShownLink] = useState(pendingLongLink);
  if (pendingLongLink && pendingLongLink !== shownLink)
    setShownLink(pendingLongLink);

  return (
    <Dialog
      isOpen={pendingLongLink !== null}
      onClose={onCancel}
      title={copy.longLinkTitle}
      description={formatCopy(copy.longLinkDescription, {
        title: shownLink?.title ?? "",
        length: shownLink?.url.length ?? 0,
        limit: LONG_LINK_WARNING_LENGTH,
      })}
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
            onClick={onConfirm}
          >
            <FiShare2 aria-hidden="true" size={18} />
            {copy.shareAnyway}
          </button>
        </>
      }
    />
  );
};

export default LongLinkDialog;
