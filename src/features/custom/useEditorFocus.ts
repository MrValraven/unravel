import { useEffect, useRef, useState } from "react";
import type { CardFocusTarget } from "./CardEditorRow";

export type FocusRequest =
  { cardKey: string; target: CardFocusTarget } | "add-card";

/**
 * Moves focus after the card list re-renders: to a new card's text, to a moved card's
 * arrow, or to a neighbour after a delete. Rows mark focusable parts with data attributes.
 */
export const useEditorFocus = () => {
  const cardListRef = useRef<HTMLOListElement>(null);
  const addCardButtonRef = useRef<HTMLButtonElement>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    const element =
      focusRequest === "add-card"
        ? addCardButtonRef.current
        : cardListRef.current?.querySelector<HTMLElement>(
            `[data-card-key="${CSS.escape(focusRequest.cardKey)}"] [data-focus-target="${focusRequest.target}"]`
          );
    element?.focus();
    setFocusRequest(null);
  }, [focusRequest]);

  return { cardListRef, addCardButtonRef, requestFocus: setFocusRequest };
};
