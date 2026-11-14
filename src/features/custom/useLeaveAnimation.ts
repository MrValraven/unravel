import { useCallback, useEffect, useRef, type AnimationEvent } from "react";

/** Calls onLeft even when animationend never fires (hidden tab, test runner). */
const LEAVE_FALLBACK_MILLISECONDS = 400;

/**
 * Runs `onLeft` once after an element's exit animation, for items that animate out
 * before they are removed. Returns the element's onAnimationEnd handler.
 */
export const useLeaveAnimation = (isLeaving: boolean, onLeft: () => void) => {
  const onLeftRef = useRef(onLeft);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    onLeftRef.current = onLeft;
  });

  const finishLeaving = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onLeftRef.current();
  }, []);

  useEffect(() => {
    if (!isLeaving) {
      hasFinishedRef.current = false;
      return;
    }
    const timer = window.setTimeout(finishLeaving, LEAVE_FALLBACK_MILLISECONDS);
    return () => window.clearTimeout(timer);
  }, [isLeaving, finishLeaving]);

  return (event: AnimationEvent<HTMLElement>) => {
    if (isLeaving && event.target === event.currentTarget) finishLeaving();
  };
};
