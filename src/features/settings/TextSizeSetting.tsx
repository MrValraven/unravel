import { useCopy } from "../../i18n/useCopy";
import {
  textScales,
  useSettings,
  type TextScale,
} from "../../storage/settings";
import { settingsCopy } from "./copy";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";

/** Three text sizes. The whole app follows at once, so the sample card shows the live result. */
export const TextSizeSetting = () => {
  const copy = useCopy(settingsCopy).textSize;
  const [settings, updateSettings] = useSettings();

  const options: SegmentedOption<TextScale>[] = textScales.map(
    (scale, scaleIndex) => ({
      value: scale,
      label: copy.options[scaleIndex] ?? String(scale),
    })
  );

  return (
    <div className="settings__field">
      <span id="text-size-label" className="settings__field-label">
        {copy.label}
      </span>
      <SegmentedControl
        labelledBy="text-size-label"
        options={options}
        value={settings.textScale}
        onChange={(textScale) => updateSettings({ textScale })}
      />
      <figure className="settings__sample">
        <figcaption className="settings__sample-label">
          {copy.previewLabel}
        </figcaption>
        <p className="settings__sample-text">{copy.sample}</p>
      </figure>
    </div>
  );
};
