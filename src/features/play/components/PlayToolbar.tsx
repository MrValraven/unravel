import { FiMinus, FiPlus } from "react-icons/fi";
import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { textScales, useSettings } from "../../../storage/settings";
import { playCopy } from "../copy";
import "./PlayToolbar.scss";

interface PlayToolbarProps {
  cardNumber: number;
  totalCards: number;
  progressFraction: number;
}

/** Where you are in the deck, and A-/A+ for the card text. */
export const PlayToolbar = ({
  cardNumber,
  totalCards,
  progressFraction,
}: PlayToolbarProps) => {
  const copy = useCopy(playCopy);
  const [settings, updateSettings] = useSettings();
  const scaleIndex = textScales.indexOf(settings.textScale);
  const smallerScale = textScales[scaleIndex - 1];
  const largerScale = textScales[scaleIndex + 1];

  return (
    <div className="play-toolbar">
      <div className="play-toolbar__progress">
        <p className="play-toolbar__position">
          {formatCopy(copy.card.position, {
            current: cardNumber,
            total: totalCards,
          })}
        </p>
        <div className="play-toolbar__track" aria-hidden="true">
          <span
            className="play-toolbar__fill"
            style={{ transform: `scaleX(${progressFraction})` }}
          />
        </div>
      </div>
      <div
        className="play-toolbar__text-size"
        role="group"
        aria-label={copy.controls.textSizeLabel}
      >
        <button
          type="button"
          className="icon-button play-toolbar__size-button"
          aria-label={copy.controls.smallerText}
          aria-disabled={smallerScale === undefined || undefined}
          onClick={() => {
            if (smallerScale !== undefined)
              updateSettings({ textScale: smallerScale });
          }}
        >
          <span aria-hidden="true">A</span>
          <FiMinus aria-hidden="true" size={12} />
        </button>
        <button
          type="button"
          className="icon-button play-toolbar__size-button play-toolbar__size-button--large"
          aria-label={copy.controls.largerText}
          aria-disabled={largerScale === undefined || undefined}
          onClick={() => {
            if (largerScale !== undefined)
              updateSettings({ textScale: largerScale });
          }}
        >
          <span aria-hidden="true">A</span>
          <FiPlus aria-hidden="true" size={12} />
        </button>
      </div>
    </div>
  );
};

export default PlayToolbar;
