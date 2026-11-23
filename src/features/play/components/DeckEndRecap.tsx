import { useId, useRef, useState } from "react";
import { FiShare2 } from "react-icons/fi";
import { useCopy } from "../../../i18n/useCopy";
import { flowCopy } from "../flowCopy";
import { buildDeckShareUrl } from "../../share/deckShareUrl";
import { ShareLinkDialog } from "../../share/ShareLinkDialog";
import { shareLink, type ShareLinkOutcome } from "../../share/shareLink";
import { buildRecapText, type DeckEndState } from "../deckEnd";
import "./DeckEndRecap.scss";

interface DeckEndRecapProps {
  deckId: string;
  deckTitle: string;
  endState: DeckEndState;
}

/** The game in one line, ready to send to the group chat. */
export const DeckEndRecap = ({
  deckId,
  deckTitle,
  endState,
}: DeckEndRecapProps) => {
  const copy = useCopy(flowCopy).end;
  const titleId = useId();
  const [outcome, setOutcome] = useState<ShareLinkOutcome | null>(null);
  const recapText = buildRecapText(copy, deckTitle, endState);
  const url = buildDeckShareUrl(deckId, window.location.origin);
  const clipboardText = `${recapText} ${url}`;

  // A second tap while the share sheet is open would be refused and fall to the
  // clipboard, so it is ignored until the first share settles.
  const isSharingRef = useRef(false);
  const handleShare = async () => {
    if (isSharingRef.current) return;
    isSharingRef.current = true;
    setOutcome(null);
    try {
      setOutcome(await shareLink({ text: recapText, url, clipboardText }));
    } finally {
      isSharingRef.current = false;
    }
  };

  const statusText = outcome === "copied" ? copy.recapCopied : "";

  return (
    <section className="deck-end-recap" aria-labelledby={titleId}>
      <h2 id={titleId} className="deck-end-recap__title">
        {copy.recapTitle}
      </h2>
      <p className="deck-end-recap__text">{recapText}</p>
      <button
        type="button"
        className="button button--secondary"
        onClick={() => void handleShare()}
      >
        <FiShare2 aria-hidden="true" size={18} />
        {copy.shareRecap}
      </button>
      <p className="deck-end-recap__status" role="status">
        {statusText}
      </p>
      {/* The sentence and the link to copy by hand, as the clipboard would have had them. */}
      <ShareLinkDialog
        isOpen={outcome === "unavailable"}
        url={clipboardText}
        onClose={() => setOutcome(null)}
      />
    </section>
  );
};

export default DeckEndRecap;
