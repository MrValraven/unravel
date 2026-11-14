import { PageHeader } from "../../components/PageHeader";
import type { Locale } from "../../content/types";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useCopy } from "../../i18n/useCopy";
import { useSettings } from "../../storage/settings";
import { AboutSection } from "./AboutSection";
import { settingsCopy } from "./copy";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import { StatsPanel } from "./StatsPanel";
import { SwitchRow } from "./SwitchRow";
import { TextSizeSetting } from "./TextSizeSetting";
import "./SettingsPage.scss";

/** Each language is named in its own language so anyone can find theirs. */
const languageOptions: SegmentedOption<Locale>[] = [
  { value: "en", label: "English", lang: "en" },
  { value: "pt", label: "Português", lang: "pt-PT" },
];

const canVibrate = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const SettingsPage = () => {
  const copy = useCopy(settingsCopy);
  const [settings, updateSettings] = useSettings();
  useDocumentTitle(copy.documentTitle);

  return (
    <main className="page settings">
      <PageHeader backTo="/" backLabel={copy.backToHome} title={copy.title} />

      <section
        className="settings__section"
        aria-labelledby="preferences-title"
      >
        <h2 id="preferences-title" className="settings__section-title">
          {copy.preferencesTitle}
        </h2>
        <div className="settings__field">
          <span id="language-label" className="settings__field-label">
            {copy.language.label}
          </span>
          <SegmentedControl
            labelledBy="language-label"
            options={languageOptions}
            value={settings.locale}
            onChange={(locale) => updateSettings({ locale })}
          />
        </div>
        <TextSizeSetting />
        <div className="settings__switches">
          <SwitchRow
            label={copy.dimMode.label}
            description={copy.dimMode.description}
            isOn={settings.isDimMode}
            onToggle={(isDimMode) => updateSettings({ isDimMode })}
          />
          {canVibrate() && (
            <SwitchRow
              label={copy.haptics.label}
              description={copy.haptics.description}
              isOn={settings.isHapticsEnabled}
              onToggle={(isHapticsEnabled) =>
                updateSettings({ isHapticsEnabled })
              }
            />
          )}
        </div>
      </section>

      <StatsPanel />
      <AboutSection />
    </main>
  );
};

export default SettingsPage;
