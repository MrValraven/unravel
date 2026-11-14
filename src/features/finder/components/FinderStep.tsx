import { useEffect, useId, useRef } from "react";
import type { IconType } from "react-icons";
import { FiCheck } from "react-icons/fi";
import "./FinderStep.scss";

export interface FinderStepChoice<Value extends string> {
  value: Value;
  label: string;
  icon: IconType;
}

interface FinderStepProps<Value extends string> {
  question: string;
  choices: FinderStepChoice<Value>[];
  selectedValue: Value | undefined;
  onSelect: (value: Value) => void;
  /** Moves focus to the question when the step appears after a choice. */
  shouldFocusQuestion: boolean;
}

/** One finder question with a button per answer. Choosing an answer moves on. */
export const FinderStep = <Value extends string>({
  question,
  choices,
  selectedValue,
  onSelect,
  shouldFocusQuestion,
}: FinderStepProps<Value>) => {
  const questionId = useId();
  const questionRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (shouldFocusQuestion) questionRef.current?.focus();
  }, [shouldFocusQuestion]);

  return (
    <section className="finder-step" aria-labelledby={questionId}>
      <h2
        id={questionId}
        ref={questionRef}
        tabIndex={-1}
        className="finder-step__question"
      >
        {question}
      </h2>
      <ul className="finder-step__choices" role="list">
        {choices.map((choice) => {
          const isSelected = choice.value === selectedValue;
          const Icon = choice.icon;
          return (
            <li key={choice.value}>
              <button
                type="button"
                className={`finder-step__choice${isSelected ? " finder-step__choice--selected" : ""}`}
                aria-pressed={isSelected}
                onClick={() => onSelect(choice.value)}
              >
                <span className="finder-step__choice-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <span className="finder-step__choice-label">
                  {choice.label}
                </span>
                {isSelected && (
                  <FiCheck
                    className="finder-step__check"
                    aria-hidden="true"
                    size={20}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FinderStep;
