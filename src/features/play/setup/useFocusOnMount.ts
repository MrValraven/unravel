import { useEffect, useRef } from "react";

/**
 * Focuses the element once when the step mounts. Each play step replaces the
 * one before, so this gives screen readers the new step's heading to read.
 */
export function useFocusOnMount<Target extends HTMLElement>() {
  const elementRef = useRef<Target>(null);
  useEffect(() => {
    elementRef.current?.focus({ preventScroll: true });
  }, []);
  return elementRef;
}
