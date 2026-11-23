import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router";

interface UnsavedChangesGuard {
  /** True while an in-app navigation is held back and the player is being asked. */
  isBlocked: boolean;
  /** Keep editing: drops the held navigation. */
  stay: () => void;
  /** Discard: carries on with the held navigation. */
  leave: () => void;
  /** Lets the next navigation through unasked, for the editor's own exit after a save. */
  allowNextNavigation: () => void;
}

/**
 * Guards unsaved edits. In-app exits (browser Back, links, the header back link and the
 * service worker's reminder navigation) go through React Router's useBlocker, which the
 * app's data router supports; a move to another path is held while there are edits, and the
 * caller shows DiscardChangesDialog. Reloads, tab closes and typed URLs never reach the
 * router, so the browser's own beforeunload prompt covers them.
 */
export const useUnsavedChangesGuard = (
  hasUnsavedChanges: boolean
): UnsavedChangesGuard => {
  const isNextNavigationAllowedRef = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      !isNextNavigationAllowedRef.current &&
      nextLocation.pathname !== currentLocation.pathname
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older Safari and Chrome only prompt when returnValue is set.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const stay = useCallback(() => {
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);
  const leave = useCallback(() => {
    if (blocker.state === "blocked") blocker.proceed();
  }, [blocker]);
  const allowNextNavigation = useCallback(() => {
    isNextNavigationAllowedRef.current = true;
  }, []);

  return {
    isBlocked: blocker.state === "blocked",
    stay,
    leave,
    allowNextNavigation,
  };
};
