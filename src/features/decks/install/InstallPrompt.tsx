import { useState } from "react";
import { FiChevronRight, FiDownload, FiMoreVertical } from "react-icons/fi";
import { Dialog } from "../../../components/Dialog";
import { useCopy } from "../../../i18n/useCopy";
import { installCopy } from "./copy";
import { usePwaInstall } from "./usePwaInstall";
import "./InstallPrompt.scss";

const MENU_ICON_TOKEN = "{menu}";

/** Renders a step, swapping the `{menu}` token for the browser menu icon. */
const InstallStep = ({ text }: { text: string }) => {
  const [beforeIcon, afterIcon] = text.split(MENU_ICON_TOKEN);
  if (afterIcon === undefined) return <>{text}</>;
  return (
    <>
      {beforeIcon}
      <FiMoreVertical
        className="install-prompt__menu-icon"
        aria-hidden="true"
        size={16}
      />
      {afterIcon}
    </>
  );
};

interface InstallPromptProps {
  /** "icon" fits a page header (label from tablet width); "row" is a full labelled list row. */
  variant?: "icon" | "row";
  /** Extra class for the row trigger, so a list can share its own row styles. */
  className?: string;
}

/** "Install app" button and the dialog explaining how to add Unravel to the home screen. */
const InstallPrompt = ({ variant = "icon", className }: InstallPromptProps) => {
  const copy = useCopy(installCopy);
  const { canPromptNatively, promptInstall, platform, isInstalled } =
    usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);

  const closeDialog = () => setIsOpen(false);
  const handleInstallNow = async () => {
    await promptInstall();
    closeDialog();
  };

  return (
    <>
      {/* Installed: only the trigger goes, so an open dialog can still close with its animation. */}
      {!isInstalled && variant === "row" && (
        <button
          type="button"
          className={
            className
              ? `install-prompt__row ${className}`
              : "install-prompt__row"
          }
          onClick={() => setIsOpen(true)}
        >
          <FiDownload
            aria-hidden="true"
            size={20}
            className="install-prompt__row-icon"
          />
          <span className="install-prompt__row-label">{copy.trigger}</span>
          <FiChevronRight aria-hidden="true" size={20} />
        </button>
      )}
      {!isInstalled && variant === "icon" && (
        <button
          type="button"
          className="install-prompt__trigger"
          aria-label={copy.trigger}
          onClick={() => setIsOpen(true)}
        >
          <FiDownload aria-hidden="true" size={20} />
          <span className="install-prompt__trigger-label" aria-hidden="true">
            {copy.trigger}
          </span>
        </button>
      )}
      <Dialog
        isOpen={isOpen}
        onClose={closeDialog}
        title={copy.title}
        description={copy.description}
        footer={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={closeDialog}
            >
              {copy.close}
            </button>
            {canPromptNatively && (
              <button
                type="button"
                className="button button--primary"
                onClick={() => void handleInstallNow()}
              >
                <FiDownload aria-hidden="true" size={18} />
                {copy.installNow}
              </button>
            )}
          </>
        }
      >
        <ol
          className="install-prompt__steps"
          role="list"
          aria-label={copy.stepsLabel}
        >
          {copy.steps[platform].map((step) => (
            <li key={step} className="install-prompt__step">
              <InstallStep text={step} />
            </li>
          ))}
        </ol>
      </Dialog>
    </>
  );
};

export default InstallPrompt;
