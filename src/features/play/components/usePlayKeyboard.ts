import { useEffect, useRef } from "react";

interface PlayKeyboardOptions {
  onNext: () => void;
  onPrevious: () => void;
}

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.closest("input, textarea, select") !== null);

/** ArrowRight and Space go to the next card, ArrowLeft to the previous one. Quiet while a dialog is open. */
export function usePlayKeyboard({
  onNext,
  onPrevious,
}: PlayKeyboardOptions): void {
  const handlersRef = useRef({ onNext, onPrevious });

  useEffect(() => {
    handlersRef.current = { onNext, onPrevious };
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      // An open dialog owns the keyboard. A closing one is inert while it animates out, and lets go.
      if (
        document.querySelector(
          ".dialog:not([inert]) [role='dialog'][aria-modal='true']"
        )
      )
        return;
      const isOnButton =
        event.target instanceof Element &&
        event.target.closest("button, a") !== null;
      if (event.key === "ArrowRight" || (event.key === " " && !isOnButton)) {
        event.preventDefault();
        handlersRef.current.onNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlersRef.current.onPrevious();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
