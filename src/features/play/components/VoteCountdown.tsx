import { FiTarget } from "react-icons/fi";
import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { useHaptics } from "../../../hooks/useHaptics";
import { playCopy } from "../copy";
import { useVoteCountdown } from "./useVoteCountdown";
import "./VoteCountdown.scss";

/**
 * The footer control of a vote card. A "Point on 3" button; once pressed the same
 * button shows a big 3, 2, 1, "Point!" (marked aria-disabled, so focus stays on it)
 * that a polite live region reads out. The haptic buzz lands on "Point!".
 */
export const VoteCountdown = () => {
  const copy = useCopy(playCopy).vote;
  const haptics = useHaptics();
  const { step, start } = useVoteCountdown(haptics.success);

  const isCounting = step !== null;
  const shownText = step === "point" ? copy.point : step === null ? "" : step;
  const spokenText =
    step === "point"
      ? copy.point
      : step === null
        ? ""
        : formatCopy(copy.counting, { number: String(step) });

  return (
    <div className="vote-countdown">
      <button
        type="button"
        className="vote-countdown__button"
        data-counting={isCounting || undefined}
        aria-disabled={isCounting || undefined}
        onClick={isCounting ? undefined : start}
      >
        {isCounting ? (
          <>
            <span
              key={step}
              className="vote-countdown__step"
              data-step={step === "point" ? "point" : "number"}
              aria-hidden="true"
            >
              {shownText}
            </span>
            {/* The name stays the same through the count; the live region reads each step. */}
            <span className="visually-hidden">{copy.pointOnThree}</span>
          </>
        ) : (
          <>
            <FiTarget aria-hidden="true" size={18} />
            <span>{copy.pointOnThree}</span>
          </>
        )}
      </button>
      <span className="vote-countdown__live visually-hidden" aria-live="polite">
        {spokenText}
      </span>
    </div>
  );
};

export default VoteCountdown;
