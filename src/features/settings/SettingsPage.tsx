import { PageHeader } from "../../components/PageHeader";
import type { Locale } from "../../content/types";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useCopy } from "../../i18n/useCopy";
import { themes, useSettings, type Theme } from "../../storage/settings";
import { AboutSection } from "./AboutSection";
import { settingsCopy } from "./copy";
import { DailyReminderSetting } from "./DailyReminderSetting";
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

  const themeOptions: SegmentedOption<Theme>[] = themes.map((theme) => ({
    value: theme,
    label: copy.theme.options[theme],
  }));

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
        <div className="settings__field">
          <span id="theme-label" className="settings__field-label">
            {copy.theme.label}
          </span>
          <SegmentedControl
            labelledBy="theme-label"
            describedBy="theme-description"
            options={themeOptions}
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
          />
          <p id="theme-description" className="settings__field-description">
            {copy.theme.description}
          </p>
        </div>
        <TextSizeSetting />
        <div className="settings__switches">
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
          <DailyReminderSetting />
        </div>
      </section>

      <StatsPanel />
      <AboutSection />
    </main>
  );
};

export default SettingsPage;
