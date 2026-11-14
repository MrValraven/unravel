import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { FiGrid, FiRotateCcw } from "react-icons/fi";
import { Dialog } from "../../../components/Dialog";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import "./PlayMenu.scss";

interface PlayMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
}

/** Restart (asked twice, since it clears the saved place) and the way back to the decks. */
export const PlayMenu = ({ isOpen, onClose, onRestart }: PlayMenuProps) => {
  const copy = useCopy(playCopy);
  const [isConfirmingRestart, setIsConfirmingRestart] = useState(false);
  const keepPlayingRef = useRef<HTMLButtonElement>(null);
  const restartChoiceRef = useRef<HTMLButtonElement>(null);
  const hasSwappedRef = useRef(false);

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
