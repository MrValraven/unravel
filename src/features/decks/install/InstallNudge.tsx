import { useId, useState } from "react";
import { FiDownload, FiSmartphone } from "react-icons/fi";
import { useCopy } from "../../../i18n/useCopy";
import {
  dismissInstallNudge,
  useIsInstallNudgeDismissed,
  type InstallNudgePlacement,
} from "../../../storage/installNudge";
import { installCopy } from "./copy";
import { InstallStep } from "./InstallPrompt";
import { usePwaInstall } from "./usePwaInstall";
import "./InstallNudge.scss";

interface InstallNudgeProps {
  /** Each placement remembers its own "Not now". */
  placement: InstallNudgePlacement;
}

/**
 * An inline card suggesting to install the app. It shows only where installing
 * is possible right now: the browser handed over its prompt, or iOS, where Add
 * to Home Screen is always there. Gone once installed or dismissed.
 */
export const InstallNudge = ({ placement }: InstallNudgeProps) => {
  const copy = useCopy(installCopy);
  const { canPromptNatively, promptInstall, platform, isInstalled } =
    usePwaInstall();
  const isDismissed = useIsInstallNudgeDismissed(placement);
  const [areStepsOpen, setAreStepsOpen] = useState(false);
  const titleId = useId();
  const stepsId = useId();

  const isInstallable = canPromptNatively || platform === "ios";
  if (isInstalled || isDismissed || !isInstallable) return null;

  return (
    <aside className="install-nudge" aria-labelledby={titleId}>
      <span className="install-nudge__icon" aria-hidden="true">
        <FiSmartphone size={22} />
      </span>
      <div className="install-nudge__body">
        <h2 id={titleId} className="install-nudge__title">
          {copy.nudge.title}
        </h2>
        <p className="install-nudge__text">{copy.nudge.body}</p>
        {!canPromptNatively && areStepsOpen && (
          <ol
            id={stepsId}
            className="install-prompt__steps install-nudge__steps"
            role="list"
            aria-label={copy.stepsLabel}
          >
            {copy.steps[platform].map((step) => (
              <li key={step} className="install-prompt__step">
                <InstallStep text={step} />
              </li>
            ))}
          </ol>
        )}
        <div className="install-nudge__actions">
          {canPromptNatively ? (
            <button
              type="button"
              className="button button--primary"
              onClick={() => void promptInstall()}
            >
              <FiDownload aria-hidden="true" size={18} />
              {copy.nudge.install}
            </button>
          ) : (
            <button
              type="button"
              className="button button--secondary"
              aria-expanded={areStepsOpen}
              aria-controls={areStepsOpen ? stepsId : undefined}
              onClick={() => setAreStepsOpen((isOpen) => !isOpen)}
            >
              {areStepsOpen ? copy.nudge.hideSteps : copy.nudge.showSteps}
            </button>
          )}
          <button
            type="button"
            className="button button--quiet"
            onClick={() => dismissInstallNudge(placement)}
          >
            {copy.nudge.dismiss}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default InstallNudge;
