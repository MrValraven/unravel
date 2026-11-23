import { useState } from "react";
import { useNavigate } from "react-router";
import type { AgeGateDialogProps } from "../../components/AgeGateDialog";
import { useResumableGame } from "../../components/useResumableGame";
import type { DeckMeta } from "../../content/types";
import { useHaptics } from "../../hooks/useHaptics";
import { localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useAgeConfirmed } from "../../storage/ageGate";
import type { ReplaceSavedGameDialogProps } from "../play/setup/ReplaceSavedGameDialog";
import { REPLACE_CONFIRMED_STATE } from "../play/setup/replaceConfirmation";

interface PendingGatedAction {
  deckTitle: string;
  action: () => void;
}

export interface StartDeckOptions {
  /** True when the screen already warned that the saved game is replaced, so no dialog asks. */
  isReplaceAcknowledged?: boolean;
}

export interface DeckStartControls {
  /** Runs `action` now, or after the age gate when the deck is adult and age is unconfirmed. */
  runAfterAgeGate: (deck: DeckMeta, action: () => void) => void;
  /**
   * Goes straight into play with the last-used options (a saved game of this
   * deck resumes), asking for age first when needed, then before replacing
   * another deck's saved game.
   */
  startDeck: (deck: DeckMeta, options?: StartDeckOptions) => void;
  /** Opens Game options for the deck, asking for age first when needed. */
  openGameOptions: (deck: DeckMeta) => void;
  /** Spread onto `<AgeGateDialog />`. */
  ageGateProps: AgeGateDialogProps;
  /** Spread onto `<ReplaceSavedGameDialog />`. */
  replaceDialogProps: ReplaceSavedGameDialogProps;
}

export const useDeckStart = (): DeckStartControls => {
  const navigate = useNavigate();
  const locale = useLocale();
  const haptics = useHaptics();
  const isAgeConfirmed = useAgeConfirmed();
  const savedGame = useResumableGame();
  const [pendingAction, setPendingAction] = useState<PendingGatedAction | null>(
    null
  );
  // Kept apart from the pending action so the dialog keeps its title while it animates out.
  const [isAgeGateOpen, setIsAgeGateOpen] = useState(false);
  const [deckPendingReplace, setDeckPendingReplace] = useState<DeckMeta | null>(
    null
  );
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);

  const runAfterAgeGate = (deck: DeckMeta, action: () => void) => {
    if (!deck.isAdult || isAgeConfirmed) {
      action();
      return;
    }
    setPendingAction({ deckTitle: localize(deck.title, locale), action });
    setIsAgeGateOpen(true);
  };

  // The state tells the play page the player already agreed, so it does not ask again.
  const goToPlay = (deck: DeckMeta) => {
    haptics.tap();
    void navigate(`/play/${encodeURIComponent(deck.id)}`, {
      viewTransition: true,
      state: REPLACE_CONFIRMED_STATE,
    });
  };

  const startDeck = (deck: DeckMeta, options: StartDeckOptions = {}) =>
    runAfterAgeGate(deck, () => {
      const isReplacing =
        savedGame !== undefined && savedGame.deck.id !== deck.id;
      if (!isReplacing || options.isReplaceAcknowledged) {
        goToPlay(deck);
        return;
      }
      setDeckPendingReplace(deck);
      setIsReplaceOpen(true);
    });

  // Same path as buildGameOptionsPath in play/playSession: keep the two in step.
  const openGameOptions = (deck: DeckMeta) =>
    runAfterAgeGate(deck, () => {
      void navigate(`/play/${encodeURIComponent(deck.id)}?setup=1`, {
        viewTransition: true,
      });
    });

  return {
    runAfterAgeGate,
    startDeck,
    openGameOptions,
    ageGateProps: {
      isOpen: isAgeGateOpen,
      deckTitle: pendingAction?.deckTitle ?? "",
      onConfirm: () => {
        setIsAgeGateOpen(false);
        pendingAction?.action();
      },
      onCancel: () => setIsAgeGateOpen(false),
    },
    replaceDialogProps: {
      isOpen: isReplaceOpen,
      newDeckTitle: deckPendingReplace
        ? localize(deckPendingReplace.title, locale)
        : "",
      savedGame,
      onStart: () => {
        setIsReplaceOpen(false);
        if (deckPendingReplace) goToPlay(deckPendingReplace);
      },
      onKeep: () => setIsReplaceOpen(false),
    },
  };
};
