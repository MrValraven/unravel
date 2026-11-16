import { useId, useState } from "react";
import { FiShare2 } from "react-icons/fi";
import { useCopy } from "../../../i18n/useCopy";
import { flowCopy } from "../flowCopy";
import {
  buildRecapText,
  shareRecap,
  type DeckEndState,
  type RecapShareOutcome,
} from "../deckEnd";
import "./DeckEndRecap.scss";

interface DeckEndRecapProps {
  deckTitle: string;
  endState: DeckEndState;
}

/** The game in one line, ready to send to the group chat. */
export const DeckEndRecap = ({ deckTitle, endState }: DeckEndRecapProps) => {
  const copy = useCopy(flowCopy).end;
  const titleId = useId();
  const [outcome, setOutcome] = useState<RecapShareOutcome | null>(null);
  const recapText = buildRecapText(copy, deckTitle, endState);

  const handleShare = async () => {
    setOutcome(null);
    setOutcome(await shareRecap(recapText, `${window.location.origin}/`));
  };

  const statusText =
    outcome === "copied"
      ? copy.recapCopied
      : outcome === "failed"
        ? copy.recapShareFailed
        : "";

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
    </section>
  );
};

export default DeckEndRecap;
