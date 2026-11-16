import type { CSSProperties } from "react";
import "./SegmentedControl.scss";

export interface SegmentedOption<Value extends string | number> {
  value: Value;
  label: string;
  /** BCP 47 tag when the label is in another language than the page. */
  lang?: string;
}

interface SegmentedControlProps<Value extends string | number> {
  /** Id of the visible label that names the group. */
  labelledBy: string;
  /** Id of a line that explains the choices, when there is one. */
  describedBy?: string;
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

/** A row of toggle buttons with a highlight that slides to the selected one. */
export const SegmentedControl = <Value extends string | number>({
  labelledBy,
  describedBy,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) => {
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  );
  const trackStyle = {
    "--segment-count": options.length,
    "--segment-index": selectedIndex,
  } as CSSProperties;

  return (
    <div
      className="segmented"
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={trackStyle}
    >
      <span className="segmented__highlight" aria-hidden="true" />
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            lang={option.lang}
            className={`segmented__option${isSelected ? " segmented__option--selected" : ""}`}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
