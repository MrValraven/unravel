import { FiEye, FiSmartphone } from "react-icons/fi";
import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import "./RevealCover.scss";

interface RevealCoverProps {
  /** The one player this card is for. */
  name: string;
  /** Shows the card. Leave it out for a still picture: previews and the turned table copy. */
  onReveal?: () => void;
}

/**
 * Pass-the-phone: covers the card text until the named player holds the phone and
 * taps to read it first. Screen readers hear "Pass the phone to {name}", then "Reveal card".
 */
export const RevealCover = ({ name, onReveal }: RevealCoverProps) => {
  const copy = useCopy(playCopy).cover;
  const content = (
    <>
      <FiEye aria-hidden="true" size={20} />
      <span>{copy.reveal}</span>
    </>
  );

  return (
    <div className="reveal-cover">
      <FiSmartphone
        className="reveal-cover__icon"
        aria-hidden="true"
        size={32}
      />
      <p className="reveal-cover__pass">{formatCopy(copy.passTo, { name })}</p>
      {onReveal ? (
        <button
          type="button"
          className="reveal-cover__button"
          onClick={onReveal}
        >
          {content}
        </button>
      ) : (
        <span className="reveal-cover__button">{content}</span>
      )}
    </div>
  );
};

export default RevealCover;
