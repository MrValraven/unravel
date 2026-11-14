import { FiArrowDown, FiArrowUp, FiTrash2 } from "react-icons/fi";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { customCopy } from "./copy";
import type { MoveDirection } from "./editorModel";

interface CardEditorToolsProps {
  cardNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: MoveDirection) => void;
  onDelete: () => void;
}

/** Move and delete buttons beside a card's number. Each names its card for screen readers. */
export const CardEditorTools = ({
  cardNumber,
  isFirst,
  isLast,
  onMove,
  onDelete,
}: CardEditorToolsProps) => {
  const editorCopy = useCopy(customCopy).editor;
  const number = { number: cardNumber };

  return (
    <div className="card-editor__tools">
      <button
        type="button"
        className="icon-button card-editor__tool"
        data-focus-target="move-up"
        aria-label={formatCopy(editorCopy.moveUp, number)}
        disabled={isFirst}
        onClick={() => onMove("up")}
      >
        <FiArrowUp aria-hidden="true" size={18} />
      </button>
      <button
        type="button"
        className="icon-button card-editor__tool"
        data-focus-target="move-down"
        aria-label={formatCopy(editorCopy.moveDown, number)}
        disabled={isLast}
        onClick={() => onMove("down")}
      >
        <FiArrowDown aria-hidden="true" size={18} />
      </button>
      <span className="card-editor__tools-divider" aria-hidden="true" />
      <button
        type="button"
        className="icon-button card-editor__tool card-editor__tool--delete"
        aria-label={formatCopy(editorCopy.deleteCard, number)}
        onClick={onDelete}
      >
        <FiTrash2 aria-hidden="true" size={18} />
      </button>
    </div>
  );
};

export default CardEditorTools;
