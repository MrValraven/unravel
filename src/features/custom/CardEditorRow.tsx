import { useId, useState, type AnimationEvent } from "react";
import type { CardType } from "../../content/types";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { CardEditorTools } from "./CardEditorTools";
import { CardTypePicker } from "./CardTypePicker";
import { CharacterCount, FieldProblem } from "./FieldMeta";
import { customCopy } from "./copy";
import { CARD_TEXT_MAX_LENGTH, type TextProblem } from "./deckRules";
import type { DraftCard, MoveDirection } from "./editorModel";
import { useAutoGrowTextarea } from "./useAutoGrowTextarea";
import { useLeaveAnimation } from "./useLeaveAnimation";
import "./CardEditorRow.scss";

/** Elements DeckEditorForm can move focus to, found through data-focus-target. */
export type CardFocusTarget = "text" | "move-up" | "move-down";

/** The count appears once this few characters are left, even without focus. */
const COUNT_REVEAL_WITHIN = 40;

interface CardEditorRowProps {
  card: DraftCard;
  cardNumber: number;
  isFirst: boolean;
  isLast: boolean;
  /** Added after the editor opened: animates in once. */
  isNew: boolean;
  /** Shown once the player has tried to save. */
  problem?: TextProblem;
  onTextChange: (key: string, text: string) => void;
  onTypeChange: (key: string, cardType: CardType) => void;
  onMove: (key: string, direction: MoveDirection) => void;
  /** Called after the row has animated out. */
  onDelete: (key: string) => void;
}

/** One card of the deck being written, drawn as a card: type, then the text in the card face. */
export const CardEditorRow = ({
  card,
  cardNumber,
  isFirst,
  isLast,
  isNew,
  problem,
  onTextChange,
  onTypeChange,
  onMove,
  onDelete,
}: CardEditorRowProps) => {
  const editorCopy = useCopy(customCopy).editor;
  const fieldId = useId();
  const textId = `${fieldId}-text`;
  const problemId = `${fieldId}-problem`;
  const counterId = `${fieldId}-counter`;
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEntering, setIsEntering] = useState(isNew);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const textareaRef = useAutoGrowTextarea(card.text);
  const handleLeaveAnimationEnd = useLeaveAnimation(isLeaving, () =>
    onDelete(card.key)
  );
  let rowState = "visible";
  if (isLeaving) rowState = "leaving";
  else if (isEntering) rowState = "entering";

  // Clearing "entering" stops a reorder, which moves the row in the DOM, from replaying it.
  const handleAnimationEnd = (event: AnimationEvent<HTMLLIElement>) => {
    if (isEntering && !isLeaving && event.target === event.currentTarget)
      setIsEntering(false);
    handleLeaveAnimationEnd(event);
  };
  const number = { number: cardNumber };

  const problemMessage =
    problem === "empty"
      ? editorCopy.problems.cardEmpty
      : problem === "too-long"
        ? formatCopy(editorCopy.problems.cardTooLong, {
            max: CARD_TEXT_MAX_LENGTH,
          })
        : undefined;

  return (
    <li
      className="card-editor"
      data-card-key={card.key}
      data-state={rowState}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="card-editor__strip">
        <label htmlFor={textId} className="card-editor__label">
          {formatCopy(editorCopy.cardLabel, number)}
        </label>
        <CardEditorTools
          cardNumber={cardNumber}
          isFirst={isFirst}
          isLast={isLast}
          onMove={(direction) => onMove(card.key, direction)}
          onDelete={() => setIsLeaving(true)}
        />
      </div>
      <div
        className="card-editor__face"
        data-card-type={card.type}
        data-invalid={problem ? true : undefined}
      >
        <CardTypePicker
          name={`${fieldId}-type`}
          legend={formatCopy(editorCopy.cardTypeLabel, number)}
          value={card.type}
          onChange={(cardType) => onTypeChange(card.key, cardType)}
        />
        <textarea
          ref={textareaRef}
          id={textId}
          className="card-editor__text"
          data-focus-target="text"
          rows={1}
          value={card.text}
          placeholder={editorCopy.cardPlaceholder}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? `${problemId} ${counterId}` : counterId}
          onChange={(event) => onTextChange(card.key, event.target.value)}
          onFocus={() => setIsTextFocused(true)}
          onBlur={() => setIsTextFocused(false)}
        />
        <div className="card-editor__meta">
          {problemMessage && (
            <FieldProblem id={problemId} message={problemMessage} />
          )}
          <CharacterCount
            id={counterId}
            count={card.text.trim().length}
            max={CARD_TEXT_MAX_LENGTH}
            isFieldFocused={isTextFocused}
            revealWithin={COUNT_REVEAL_WITHIN}
          />
        </div>
      </div>
    </li>
  );
};

export default CardEditorRow;
