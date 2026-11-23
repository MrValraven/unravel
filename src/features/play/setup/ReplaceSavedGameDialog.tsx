import { useRef } from "react";
import { Dialog } from "../../../components/Dialog";
import type { ResumableGame } from "../../../components/useResumableGame";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";

export interface ReplaceSavedGameDialogProps {
  isOpen: boolean;
  /** The deck about to start. */
  newDeckTitle: string;
  /** The game that Start would replace. */
  savedGame: ResumableGame | undefined;
  onStart: () => void;
  onKeep: () => void;
}

/** Asks before a new deck replaces the one saved game. Focus starts on Keep, the safe choice. */
export const ReplaceSavedGameDialog = ({
  isOpen,
  newDeckTitle,
  savedGame,
  onStart,
  onKeep,
}: ReplaceSavedGameDialogProps) => {
  const copy = useCopy(playCopy).setup.replaceDialog;
  const locale = useLocale();
  const keepButtonRef = useRef<HTMLButtonElement>(null);
  const savedDeckTitle = savedGame
    ? localize(savedGame.deck.title, locale)
    : "";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onKeep}
      title={formatCopy(copy.title, { deck: savedDeckTitle })}
      description={
        savedGame
          ? formatCopy(copy.body, {
              current: savedGame.currentCardNumber,
              total: savedGame.totalCardCount,
            })
          : undefined
      }
      initialFocusRef={keepButtonRef}
      footer={
        <>
          <button
            ref={keepButtonRef}
            type="button"
            className="button button--secondary"
            onClick={onKeep}
          >
            {formatCopy(copy.keep, { deck: savedDeckTitle })}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onStart}
          >
            {formatCopy(copy.start, { deck: newDeckTitle })}
          </button>
        </>
      }
    />
  );
};

export default ReplaceSavedGameDialog;
