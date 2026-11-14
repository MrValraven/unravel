import { useId, useState, type RefObject } from "react";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { CharacterCount, FieldProblem } from "./FieldMeta";
import { customCopy } from "./copy";
import { TITLE_MAX_LENGTH, type TextProblem } from "./deckRules";

/** The count appears once this few characters are left, even without focus. */
const COUNT_REVEAL_WITHIN = 15;

interface DeckTitleFieldProps {
  value: string;
  onChange: (title: string) => void;
  /** Shown once the player has tried to save. */
  problem?: TextProblem;
  inputRef: RefObject<HTMLInputElement | null>;
}

export const DeckTitleField = ({
  value,
  onChange,
  problem,
  inputRef,
}: DeckTitleFieldProps) => {
  const editorCopy = useCopy(customCopy).editor;
  const fieldId = useId();
  const inputId = `${fieldId}-input`;
  const problemId = `${fieldId}-problem`;
  const counterId = `${fieldId}-counter`;
  const [isFocused, setIsFocused] = useState(false);

  const problemMessage =
    problem === "empty"
      ? editorCopy.problems.titleEmpty
      : problem === "too-long"
        ? formatCopy(editorCopy.problems.titleTooLong, {
            max: TITLE_MAX_LENGTH,
          })
        : undefined;

  return (
    <div className="deck-editor__field deck-editor__field--title">
      <label htmlFor={inputId} className="deck-editor__label">
        {editorCopy.titleLabel}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        className="deck-editor__title-input"
        value={value}
        placeholder={editorCopy.titlePlaceholder}
        autoComplete="off"
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? `${problemId} ${counterId}` : counterId}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <div className="deck-editor__field-meta">
        {problemMessage && (
          <FieldProblem id={problemId} message={problemMessage} />
        )}
        <CharacterCount
          id={counterId}
          count={value.trim().length}
          max={TITLE_MAX_LENGTH}
          isFieldFocused={isFocused}
          revealWithin={COUNT_REVEAL_WITHIN}
        />
      </div>
    </div>
  );
};

export default DeckTitleField;
