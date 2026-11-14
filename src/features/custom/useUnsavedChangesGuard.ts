import { useEffect } from "react";

/**
 * Asks the browser to confirm before a reload, tab close or typed URL drops unsaved edits.
 * The app uses a declarative BrowserRouter, where react-router's useBlocker is unavailable,
 * so in-app exits (Cancel and the header back link) confirm through DiscardChangesDialog.
 */
export const useUnsavedChangesGuard = (hasUnsavedChanges: boolean): void => {
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
};
