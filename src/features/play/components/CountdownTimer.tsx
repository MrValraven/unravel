import { FiPause, FiPlay, FiRotateCcw } from "react-icons/fi";
import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import { formatClock, useCountdown } from "./useCountdown";
import "./CountdownTimer.scss";

interface CountdownTimerProps {
  totalSeconds: number;
  onFinish?: () => void;
  className?: string;
}

const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** A start and pause countdown ring. Colours follow currentColor, so it sits on the card or the page. */
export const CountdownTimer = ({
  totalSeconds,
  onFinish,
  className,
}: CountdownTimerProps) => {
  const copy = useCopy(playCopy).timer;
  const countdown = useCountdown(totalSeconds, onFinish);
  const clock = formatClock(countdown.remainingSeconds);

  let buttonLabel = copy.start;
  let ButtonIcon = FiPlay;
  if (countdown.isRunning) {
    buttonLabel = copy.pause;
    ButtonIcon = FiPause;
  } else if (countdown.isFinished) {
    buttonLabel = copy.restart;
    ButtonIcon = FiRotateCcw;
  } else if (countdown.hasStarted) {
    buttonLabel = copy.resume;
  }

  const classNames = [
    "countdown",
    countdown.isFinished ? "countdown--finished" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <div
        className="countdown__ring"
        role="timer"
        aria-label={formatCopy(copy.remaining, { time: clock })}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle
            className="countdown__track"
            cx="24"
            cy="24"
            r={RING_RADIUS}
          />
          <circle
            className="countdown__progress"
            cx="24"
            cy="24"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={
              RING_CIRCUMFERENCE * (1 - countdown.remainingFraction)
            }
          />
        </svg>
        <span className="countdown__clock" aria-hidden="true">
          {clock}
        </span>
      </div>
      <button
        type="button"
        className="countdown__button"
        onClick={countdown.isRunning ? countdown.pause : countdown.start}
      >
        <ButtonIcon aria-hidden="true" size={18} />
        <span>{buttonLabel}</span>
      </button>
      <span className="countdown__status" aria-live="polite">
        {countdown.isFinished ? copy.finished : ""}
      </span>
    </div>
  );
};

export default CountdownTimer;
