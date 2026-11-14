import { useEffect, useRef, useState } from "react";

const TICK_MILLISECONDS = 200;

export interface Countdown {
  remainingSeconds: number;
  /** 1 when full, 0 when finished. */
  remainingFraction: number;
  isRunning: boolean;
  isFinished: boolean;
  hasStarted: boolean;
  start: () => void;
  pause: () => void;
}

/** A pausable countdown measured against the clock, so a slow tab never stretches it. */
export function useCountdown(
  totalSeconds: number,
  onFinish?: () => void
): Countdown {
  const totalMilliseconds = totalSeconds * 1000;
  const [remainingMilliseconds, setRemainingMilliseconds] =
    useState(totalMilliseconds);
  const [isRunning, setIsRunning] = useState(false);
  const deadlineRef = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    if (!isRunning) return;
    const intervalId = window.setInterval(() => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const millisecondsLeft = Math.max(0, deadline - Date.now());
      setRemainingMilliseconds(millisecondsLeft);
      if (millisecondsLeft === 0) {
        deadlineRef.current = null;
        setIsRunning(false);
        onFinishRef.current?.();
      }
    }, TICK_MILLISECONDS);
    return () => window.clearInterval(intervalId);
  }, [isRunning]);

  const start = () => {
    // Starting a finished countdown runs it again from the top.
    const startingMilliseconds =
      remainingMilliseconds === 0 ? totalMilliseconds : remainingMilliseconds;
    setRemainingMilliseconds(startingMilliseconds);
    deadlineRef.current = Date.now() + startingMilliseconds;
    setIsRunning(true);
  };

  const pause = () => {
    const deadline = deadlineRef.current;
    if (deadline !== null) {
      setRemainingMilliseconds(Math.max(0, deadline - Date.now()));
    }
    deadlineRef.current = null;
    setIsRunning(false);
  };

  return {
    remainingSeconds: Math.ceil(remainingMilliseconds / 1000),
    remainingFraction:
      totalMilliseconds > 0 ? remainingMilliseconds / totalMilliseconds : 0,
    isRunning,
    isFinished: remainingMilliseconds === 0,
    hasStarted: remainingMilliseconds < totalMilliseconds || isRunning,
    start,
    pause,
  };
}

/** "0:30", "1:05". */
export const formatClock = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};
