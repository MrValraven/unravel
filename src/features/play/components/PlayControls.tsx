import type { RefObject } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiEyeOff,
  FiSkipForward,
  FiSlash,
} from "react-icons/fi";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import type { StepAction } from "./usePlaySession";
import "./PlayControls.scss";

interface PlayControlsProps {
  isFirstCard: boolean;
  isLastCard: boolean;
  isAdult: boolean;
  /** Lets the screen move focus to Next when the focused control goes away. */
  nextButtonRef: RefObject<HTMLButtonElement | null>;
  onAction: (action: StepAction) => void;
}

/** Previous and Next, then the quiet ways out of a card: skip, Not tonight, and Pass on adult decks. */
export const PlayControls = ({
  isFirstCard,
  isLastCard,
  isAdult,
  nextButtonRef,
  onAction,
}: PlayControlsProps) => {
  const copy = useCopy(playCopy).controls;

  return (
    <div className="play-controls">
      <div className="play-controls__nav">
        <button
          type="button"
          className="button button--secondary play-controls__previous"
          aria-label={copy.previous}
          // aria-disabled keeps focus on the button at the first card.
          aria-disabled={isFirstCard || undefined}
          onClick={() => {
            if (!isFirstCard) onAction("previous");
          }}
        >
          <FiArrowLeft aria-hidden="true" size={22} />
        </button>
        <button
          ref={nextButtonRef}
          type="button"
          className="button button--primary play-controls__next"
          onClick={() => onAction("next")}
        >
          {isLastCard ? copy.finish : copy.next}
          {isLastCard ? (
            <FiCheck aria-hidden="true" size={22} />
          ) : (
            <FiArrowRight aria-hidden="true" size={22} />
          )}
        </button>
      </div>
      <div className="play-controls__quiet">
        <button
          type="button"
          className="button button--quiet"
          onClick={() => onAction("skip")}
        >
          <FiSkipForward aria-hidden="true" size={18} />
          {copy.skip}
        </button>
        <button
          type="button"
          className="button button--quiet"
          onClick={() => onAction("hide")}
        >
          <FiEyeOff aria-hidden="true" size={18} />
          {copy.hide}
        </button>
        {isAdult && (
          <button
            type="button"
            className="button button--quiet"
            onClick={() => onAction("pass")}
          >
            <FiSlash aria-hidden="true" size={18} />
            {copy.pass}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayControls;
