import type { IconType } from "react-icons";
import {
  FiMessageCircle,
  FiTarget,
  FiThermometer,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import type { CardType } from "../../content/types";
import { useCopy } from "../../i18n/useCopy";
import { customCopy } from "./copy";
import { customCardTypes } from "./deckRules";
import "./CardTypePicker.scss";

const cardTypeIcons: Record<CardType, IconType> = {
  question: FiMessageCircle,
  challenge: FiZap,
  everyone: FiUsers,
  vote: FiTarget,
  "hot-seat": FiThermometer,
};

interface CardTypePickerProps {
  /** Unique per card: groups the radio buttons. */
  name: string;
  /** Accessible name of the group, e.g. "Card 2 type". */
  legend: string;
  value: CardType;
  onChange: (cardType: CardType) => void;
}

/**
 * A segmented set of native radio buttons: Tab enters the group on the chosen type, the
 * arrow keys move and choose, and screen readers announce "radio, 1 of 5, checked".
 */
export const CardTypePicker = ({
  name,
  legend,
  value,
  onChange,
}: CardTypePickerProps) => {
  const optionLabels = useCopy(customCopy).editor.cardTypeOptions;

  return (
    <fieldset className="card-type-picker">
      <legend className="visually-hidden">{legend}</legend>
      <div className="card-type-picker__track">
        {customCardTypes.map((cardType) => {
          const Icon = cardTypeIcons[cardType];
          return (
            <label key={cardType} className="card-type-picker__option">
              <input
                type="radio"
                className="card-type-picker__input"
                name={name}
                value={cardType}
                checked={value === cardType}
                onChange={() => onChange(cardType)}
              />
              <Icon
                aria-hidden="true"
                size={16}
                className="card-type-picker__icon"
              />
              <span className="card-type-picker__label">
                {optionLabels[cardType]}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default CardTypePicker;
