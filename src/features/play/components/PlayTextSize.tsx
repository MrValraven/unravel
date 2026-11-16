import { useId } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";
import { useCopy } from "../../../i18n/useCopy";
import { textScales, useSettings } from "../../../storage/settings";
import { playCopy } from "../copy";

/** A- and A+ for the card text, on the same text size setting as Settings. */
export const PlayTextSize = () => {
  const copy = useCopy(playCopy).controls;
  const labelId = useId();
  const [settings, updateSettings] = useSettings();
  const scaleIndex = textScales.indexOf(settings.textScale);
  const smallerScale = textScales[scaleIndex - 1];
  const largerScale = textScales[scaleIndex + 1];

  return (
    <div className="play-text-size" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="play-text-size__label">
        {copy.textSizeLabel}
      </span>
      <span className="play-text-size__steps" aria-hidden="true">
        {textScales.map((scale, index) => (
          <span
            key={scale}
            className="play-text-size__step"
            data-filled={index <= scaleIndex}
          />
        ))}
      </span>
      <div className="play-text-size__buttons">
        <button
          type="button"
          className="icon-button play-text-size__button"
          aria-label={copy.smallerText}
          // aria-disabled at the limits keeps focus on the button.
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
          className="icon-button play-text-size__button play-text-size__button--large"
          aria-label={copy.largerText}
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

export default PlayTextSize;
