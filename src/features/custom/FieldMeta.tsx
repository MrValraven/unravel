import { FiAlertCircle } from "react-icons/fi";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { customCopy } from "./copy";
import "./FieldMeta.scss";

/** An inline validation message, linked to its field through aria-describedby. */
export const FieldProblem = ({
  id,
  message,
}: {
  id: string;
  message: string;
}) => (
  <p id={id} className="field-problem">
    <FiAlertCircle
      aria-hidden="true"
      size={16}
      className="field-problem__icon"
    />
    <span>{message}</span>
  </p>
);

interface CharacterCountProps {
  id: string;
  count: number;
  max: number;
  /** The field has focus: the count fades in while the player types. */
  isFieldFocused: boolean;
  /** The count also shows once this few characters or fewer are left. */
  revealWithin: number;
}

/**
 * "123/280": quiet until the field has focus or nears its limit, and in the accent colour
 * once the text runs over. Faded out it stays in the accessibility tree, so the field's
 * aria-describedby always announces the limit.
 */
export const CharacterCount = ({
  id,
  count,
  max,
  isFieldFocused,
  revealWithin,
}: CharacterCountProps) => {
  const template = useCopy(customCopy).editor.characterCount;
  const isOverLimit = count > max;
  const isVisible = isFieldFocused || max - count <= revealWithin;
  const classNames = [
    "character-count",
    isVisible ? "character-count--visible" : "",
    isOverLimit ? "character-count--over" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span id={id} className={classNames}>
      {formatCopy(template, { count, max })}
    </span>
  );
};
