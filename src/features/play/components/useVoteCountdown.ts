import { useCallback, useEffect, useRef, useState } from "react";

export type VoteStep = 3 | 2 | 1 | "point";

const STEP_MILLISECONDS = 1000;
/** "Point!" stays on screen long enough to be seen, then the button comes back. */
const POINT_MILLISECONDS = 1500;

export interface VoteCountdown {
  /** The number or word showing right now, or null when the card is at rest. */
  step: VoteStep | null;
  /** Starts 3, 2, 1, Point!. Does nothing while a count is already running. */
  start: () => void;
}

/** The "Point on 3" count: one step a second, then Point! for a moment. Timers die with the card. */
export function useVoteCountdown(onPoint: () => void): VoteCountdown {
  const [step, setStep] = useState<VoteStep | null>(null);
  const isRunningRef = useRef(false);
  const timeoutIdsRef = useRef<number[]>([]);
  const onPointRef = useRef(onPoint);

  useEffect(() => {
    onPointRef.current = onPoint;
  });

  useEffect(
    () => () => {
      for (const timeoutId of timeoutIdsRef.current) {
        window.clearTimeout(timeoutId);
      }
      timeoutIdsRef.current = [];
    },
    []
  );

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const later = (callback: () => void, milliseconds: number) => {
      timeoutIdsRef.current.push(window.setTimeout(callback, milliseconds));
    };

    setStep(3);
    later(() => setStep(2), STEP_MILLISECONDS);
    later(() => setStep(1), STEP_MILLISECONDS * 2);
    later(() => {
      setStep("point");
      onPointRef.current();
    }, STEP_MILLISECONDS * 3);
    later(
      () => {
        setStep(null);
        isRunningRef.current = false;
        timeoutIdsRef.current = [];
      },
      STEP_MILLISECONDS * 3 + POINT_MILLISECONDS
    );
  }, []);

  return { step, start };
}
