import { useId, useRef, useState } from "react";
import { Dialog } from "../../components/Dialog";
import { useCopy } from "../../i18n/useCopy";
import { shareCopy } from "./copy";
import "./ShareLinkDialog.scss";

interface ShareLinkDialogProps {
  isOpen: boolean;
  /** What to copy by hand: the link, or a message with the link in it. */
  url: string;
  onClose: () => void;
}

/**
 * The last resort when sharing and the clipboard both fail: the link in a field that
 * selects itself on focus, so the player can copy it by hand.
 */
export const ShareLinkDialog = ({
  isOpen,
  url,
  onClose,
}: ShareLinkDialogProps) => {
  const copy = useCopy(shareCopy).linkDialog;
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep showing the last link while the dialog animates out.
  const [shownUrl, setShownUrl] = useState(url);
  if (url && url !== shownUrl) setShownUrl(url);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      initialFocusRef={inputRef}
      footer={
        <button
          type="button"
          className="button button--primary"
          onClick={onClose}
        >
          {copy.done}
        </button>
      }
    >
      <label htmlFor={inputId} className="share-link-dialog__label">
        {copy.fieldLabel}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        readOnly
        className="share-link-dialog__input"
        value={shownUrl}
        autoComplete="off"
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
      />
    </Dialog>
  );
};

export default ShareLinkDialog;
