import { useEffect, useRef, useState } from "react";
import { sharedCopy } from "../../components/copy";
import { formatCopy } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import {
  disableDailyCardReminder,
  enableDailyCardReminder,
  isDailyCardSyncRegistered,
  isDailyReminderSupported,
  isRunningInstalled,
  remindersStore,
  useReminders,
  type ReminderResult,
} from "../../storage/reminders";
import { SwitchRow } from "./SwitchRow";
import "./DailyReminderSetting.scss";

type ReminderCopy = (typeof sharedCopy)["en"]["dailyReminder"];

const describeFailure = (
  copy: ReminderCopy,
  result: Extract<ReminderResult, { isOk: false }>
): string =>
  formatCopy(copy.errors[result.cause], {
    reason: result.reason ?? "",
  });

/**
 * "Daily card reminder" switch for Settings. Renders only where the browser can
 * wake Unravel once a day (Chromium with Periodic Background Sync), so players
 * elsewhere never see a switch that cannot work.
 */
export const DailyReminderSetting = () => {
  const [isSupported] = useState(isDailyReminderSupported);
  if (!isSupported) return null;
  return <DailyReminderSwitch />;
};

const DailyReminderSwitch = () => {
  const copy = useCopy(sharedCopy).dailyReminder;
  const locale = useLocale();
  const { isDailyCardOn } = useReminders();
  const [isBusy, setIsBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isInstalled] = useState(isRunningInstalled);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // The browser drops the sync when the app is uninstalled or site data is cleared,
  // so a switch left on from before shows off again.
  useEffect(() => {
    if (!isDailyCardOn) return;
    let isCurrent = true;
    void isDailyCardSyncRegistered().then((isRegistered) => {
      if (isCurrent && isRegistered === false) {
        remindersStore.set({ isDailyCardOn: false });
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [isDailyCardOn]);

  const handleToggle = async (shouldTurnOn: boolean) => {
    if (isBusy) return;
    setIsBusy(true);
    setProblem("");
    setAnnouncement(shouldTurnOn ? copy.turningOn : "");
    const result = shouldTurnOn
      ? await enableDailyCardReminder(locale)
      : await disableDailyCardReminder();
    if (!isMountedRef.current) return;
    setIsBusy(false);
    if (result.isOk) {
      setAnnouncement(shouldTurnOn ? copy.turnedOn : copy.turnedOff);
      return;
    }
    setAnnouncement("");
    setProblem(describeFailure(copy, result));
  };

  const description = isInstalled
    ? copy.description
    : `${copy.description} ${copy.installFirst}`;

  return (
    <div className="daily-reminder" aria-busy={isBusy}>
      <SwitchRow
        label={copy.label}
        description={description}
        isOn={isDailyCardOn}
        onToggle={(shouldTurnOn) => void handleToggle(shouldTurnOn)}
      />
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
      <p className="daily-reminder__problem" role="alert" hidden={!problem}>
        {problem}
      </p>
    </div>
  );
};

export default DailyReminderSetting;
