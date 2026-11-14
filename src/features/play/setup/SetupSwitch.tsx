import { useId } from "react";
import "./SetupSwitch.scss";

interface SetupSwitchProps {
  title: string;
  hint: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
}

/** A labelled on/off switch: a native checkbox with the switch role, so it works with every input method. */
export const SetupSwitch = ({
  title,
  hint,
  isOn,
  onChange,
}: SetupSwitchProps) => {
  const hintId = useId();
  return (
    <label className="setup-switch">
      <span className="setup-switch__text">
        <span className="setup-switch__title">{title}</span>
        <span id={hintId} className="setup-switch__hint">
          {hint}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="setup-switch__input"
        checked={isOn}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="setup-switch__track" aria-hidden="true">
        <span className="setup-switch__thumb" />
      </span>
    </label>
  );
};

export default SetupSwitch;
