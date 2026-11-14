import { useState } from "react";
import { useNavigate } from "react-router";
import type { AgeGateDialogProps } from "../../components/AgeGateDialog";
import type { DeckMeta } from "../../content/types";
import { useHaptics } from "../../hooks/useHaptics";
import { localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useAgeConfirmed } from "../../storage/ageGate";

interface PendingGatedAction {
  deckTitle: string;
  action: () => void;
}

export interface DeckStartControls {
  /** Runs `action` now, or after the age gate when the deck is adult and age is unconfirmed. */
  runAfterAgeGate: (deck: DeckMeta, action: () => void) => void;
  /** Opens the play screen for the deck, asking for age first when needed. */
  startDeck: (deck: DeckMeta) => void;
  /** Spread onto `<AgeGateDialog />`. */
  ageGateProps: AgeGateDialogProps;
}

export const useDeckStart = (): DeckStartControls => {
  const navigate = useNavigate();
  const locale = useLocale();
  const haptics = useHaptics();
  const isAgeConfirmed = useAgeConfirmed();
  const [pendingAction, setPendingAction] = useState<PendingGatedAction | null>(
    null
  );
  // Kept apart from the pending action so the dialog keeps its title while it animates out.
  const [isAgeGateOpen, setIsAgeGateOpen] = useState(false);

  const runAfterAgeGate = (deck: DeckMeta, action: () => void) => {
    if (!deck.isAdult || isAgeConfirmed) {
      action();
      return;
    }
    setPendingAction({ deckTitle: localize(deck.title, locale), action });
    setIsAgeGateOpen(true);
  };

  const startDeck = (deck: DeckMeta) =>
    runAfterAgeGate(deck, () => {
      haptics.tap();
      void navigate(`/play/${encodeURIComponent(deck.id)}`);
    });

  return {
    runAfterAgeGate,
    startDeck,
    ageGateProps: {
      isOpen: isAgeGateOpen,
      deckTitle: pendingAction?.deckTitle ?? "",
      onConfirm: () => {
        setIsAgeGateOpen(false);
        pendingAction?.action();
      },
      onCancel: () => setIsAgeGateOpen(false),
    },
  };
};
