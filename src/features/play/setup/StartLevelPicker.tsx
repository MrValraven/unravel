import { useId } from "react";
import type { Deck, IntensityLevel } from "../../../content/types";
import { pluralize } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import { countCardsFromLevel } from "../playSession";
import "./StartLevelPicker.scss";

interface StartLevelPickerProps {
  deck: Deck;
  startLevel: IntensityLevel;
  onChange: (startLevel: IntensityLevel) => void;
}

const levelKeys = [
  { level: 1, key: "warm" },
  { level: 2, key: "deeper" },
  { level: 3, key: "allIn" },
] as const;

/** Warm, Deeper or All in, each showing how many cards that start gives. */
export const StartLevelPicker = ({
  deck,
  startLevel,
  onChange,
}: StartLevelPickerProps) => {
  const copy = useCopy(playCopy).setup;
  const groupName = useId();

  return (
    <fieldset className="level-picker">
      <legend className="play-setup__section-title">{copy.levelTitle}</legend>
      <div className="level-picker__options">
        {levelKeys.map(({ level, key }) => {
          const cardCount = countCardsFromLevel(deck, level);
          const levelCopy = copy.levels[key];
          return (
            <label
              key={level}
              className={`level-picker__option${cardCount === 0 ? " level-picker__option--empty" : ""}`}
            >
              <input
                type="radio"
                name={groupName}
                className="level-picker__input"
                value={level}
                checked={startLevel === level}
                disabled={cardCount === 0}
                onChange={() => onChange(level)}
              />
              <span className="level-picker__meter" aria-hidden="true">
                {levelKeys.map((meterStep) => (
                  <span
                    key={meterStep.level}
                    className={`level-picker__pip${meterStep.level <= level ? " level-picker__pip--on" : ""}`}
                  />
                ))}
              </span>
              <span className="level-picker__title">{levelCopy.title}</span>
              <span className="level-picker__note">{levelCopy.note}</span>
              <span className="level-picker__count">
                {pluralize(cardCount, copy.cardCount)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default StartLevelPicker;
