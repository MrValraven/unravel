import React, { useEffect, useState } from "react";
import { MdInstallMobile } from "react-icons/md";
import { usePwaInstall } from "../usePwaInstall";
import "./styles.scss";

const INSTRUCTIONS = {
  ios: [
    "Tap the Share button in Safari's toolbar.",
    'Choose "Add to Home Screen".',
    'Tap "Add" to finish.',
  ],
  android: [
    "Open the browser menu (⋮).",
    'Choose "Install app" or "Add to Home screen".',
    "Confirm to finish.",
  ],
  desktop: [
    "Click the install icon in the address bar.",
    'Or open the browser menu and choose "Install Unravel".',
    "Confirm to finish.",
  ],
};

const InstallPrompt = () => {
  const { canPromptNatively, promptInstall, platform, isInstalled } =
    usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);

  // Close the modal on Escape while it is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Nothing to install from inside the already-installed app.
  if (isInstalled) return null;

  const steps = INSTRUCTIONS[platform];

  return (
    <>
      <button
        type="button"
        className="installButton"
        onClick={() => setIsOpen(true)}
      >
        <MdInstallMobile aria-hidden="true" />
        <span>Install App</span>
      </button>

      {isOpen && (
        <div
          className="installModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="installModalTitle"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="installModalCard"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="installModalTitle">Install Unravel</h3>

            {canPromptNatively && (
              <button
                type="button"
                className="installModalPrimary"
                onClick={promptInstall}
              >
                Install app
              </button>
            )}

            <ol className="installSteps">
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>

            <button
              type="button"
              className="secondaryButton"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;
