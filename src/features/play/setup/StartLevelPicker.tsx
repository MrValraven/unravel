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
  /**
   * During a game: levels below this one are past. They stay selectable for
   * Start over, and are dimmed so they read as not for Save and continue.
   */
  lowestContinueLevel?: IntensityLevel;
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
  lowestContinueLevel = 1,
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
          const isEmpty = cardCount === 0;
          const isPast = !isEmpty && level < lowestContinueLevel;
          return (
            <label
              key={level}
              className={`level-picker__option${isEmpty ? " level-picker__option--empty" : ""}${isPast ? " level-picker__option--past" : ""}`}
            >
              <input
                type="radio"
                name={groupName}
                className="level-picker__input"
                value={level}
                checked={startLevel === level}
                disabled={isEmpty}
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
