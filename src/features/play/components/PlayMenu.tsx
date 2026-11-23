import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { FiGrid, FiRotateCcw, FiSliders } from "react-icons/fi";
import { Dialog } from "../../../components/Dialog";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import { OPENED_FROM_GAME_STATE } from "../setup/gameOptionsNavigation";
import { PlayTextSize } from "./PlayTextSize";
import "./PlayMenu.scss";

interface PlayMenuProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
}

/**
 * Text size, game options (change the running game or start it over), restart
 * (asked twice, since it clears the saved place) and the way back to the decks.
 */
export const PlayMenu = ({
  deckId,
  isOpen,
  onClose,
  onRestart,
}: PlayMenuProps) => {
  const copy = useCopy(playCopy);
  const [isConfirmingRestart, setIsConfirmingRestart] = useState(false);
  const keepPlayingRef = useRef<HTMLButtonElement>(null);
  const restartChoiceRef = useRef<HTMLButtonElement>(null);
  const hasSwappedRef = useRef(false);
  const gameOptionsNoteId = useId();

  // The focused button leaves when the content swaps, so focus follows to the
  // safe choice on the confirm step and back to Restart after it.
  useEffect(() => {
    if (!hasSwappedRef.current) return;
    (isConfirmingRestart ? keepPlayingRef : restartChoiceRef).current?.focus();
  }, [isConfirmingRestart]);

  const showConfirm = (isConfirming: boolean) => {
    hasSwappedRef.current = true;
    setIsConfirmingRestart(isConfirming);
  };

  const handleClose = () => {
    hasSwappedRef.current = false;
    setIsConfirmingRestart(false);
    onClose();
  };

  const handleRestart = () => {
    hasSwappedRef.current = false;
    setIsConfirmingRestart(false);
    onRestart();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={copy.menu.title}
      variant="sheet"
    >
      {isConfirmingRestart ? (
        <div className="play-menu play-menu--confirm" key="confirm">
          <p>{copy.menu.restartQuestion}</p>
          <button
            type="button"
            className="button button--primary"
            onClick={handleRestart}
          >
            <FiRotateCcw aria-hidden="true" size={20} />
            {copy.menu.restart}
          </button>
          <button
            ref={keepPlayingRef}
            type="button"
            className="button button--secondary"
            onClick={() => showConfirm(false)}
          >
            {copy.menu.keepPlaying}
          </button>
        </div>
      ) : (
        <div className="play-menu" key="choices">
          <PlayTextSize />
          <Link
            to={`/play/${encodeURIComponent(deckId)}?setup=1`}
            className="button button--secondary play-menu__item"
            viewTransition
            // Leaving Game options pops this entry instead of replacing it.
            state={OPENED_FROM_GAME_STATE}
            // The note is the link's description, so its name stays short.
            aria-describedby={gameOptionsNoteId}
            onClick={handleClose}
          >
            <FiSliders aria-hidden="true" size={20} />
            <span className="play-menu__item-text">
              {copy.menu.gameOptions}
              <span
                id={gameOptionsNoteId}
                className="play-menu__item-note"
                aria-hidden="true"
              >
                {copy.menu.gameOptionsNote}
              </span>
            </span>
          </Link>
          <button
            ref={restartChoiceRef}
            type="button"
            className="button button--secondary play-menu__item"
            onClick={() => showConfirm(true)}
          >
            <FiRotateCcw aria-hidden="true" size={20} />
            {copy.menu.restart}
          </button>
          <Link
            to="/decks"
            className="button button--secondary play-menu__item"
            viewTransition
          >
            <FiGrid aria-hidden="true" size={20} />
            {copy.backToDecks}
          </Link>
        </div>
      )}
    </Dialog>
  );
};

export default PlayMenu;
