import { useId } from "react";
import "./SwitchRow.scss";

interface SwitchRowProps {
  label: string;
  description?: string;
  isOn: boolean;
  onToggle: (isOn: boolean) => void;
}

/** A settings row whose whole width is an on/off switch. */
export const SwitchRow = ({
  label,
  description,
  isOn,
  onToggle,
}: SwitchRowProps) => {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      className="switch-row"
      onClick={() => onToggle(!isOn)}
    >
      <span className="switch-row__text">
        <span id={labelId} className="switch-row__label">
          {label}
        </span>
        {description && (
          <span id={descriptionId} className="switch-row__description">
            {description}
          </span>
        )}
      </span>
      <span
        className={`switch-row__track${isOn ? " switch-row__track--on" : ""}`}
        aria-hidden="true"
      >
        <span className="switch-row__thumb" />
      </span>
    </button>
  );
};
