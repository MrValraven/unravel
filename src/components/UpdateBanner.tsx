import { useEffect, useRef, useState } from "react";
import { FiRefreshCw, FiX } from "react-icons/fi";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useCopy } from "../i18n/useCopy";
import { sharedCopy } from "./copy";
import "./UpdateBanner.scss";

/** The page reloads into the new version on success; still here after this means it failed. */
const RELOAD_TIMEOUT_MILLISECONDS = 10_000;

/** An app left open for days still hears about a new deploy within the hour. */
const UPDATE_CHECK_INTERVAL_MILLISECONDS = 60 * 60 * 1000;

/** Asks the browser to look for a new service worker on a fixed interval while the app is open. */
const scheduleUpdateChecks = (
  _serviceWorkerUrl: string,
  registration: ServiceWorkerRegistration | undefined
) => {
  if (!registration) return;
  window.setInterval(() => {
    // Offline or a failed fetch just waits for the next check.
    registration.update().catch(() => undefined);
  }, UPDATE_CHECK_INTERVAL_MILLISECONDS);
};

/**
 * Global "A new version of Unravel is ready" banner. The service worker runs in prompt
 * mode: a new version installs in the background and waits until the player
 * picks "Update now", which activates it and reloads the page.
 */
export const UpdateBanner = () => {
  const copy = useCopy(sharedCopy).updateBanner;
  const {
    needRefresh: [isUpdateWaiting, setIsUpdateWaiting],
    updateServiceWorker,
  } = useRegisterSW({ onRegisteredSW: scheduleUpdateChecks });
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpdateFailed, setHasUpdateFailed] = useState(false);
  const reloadTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(reloadTimeoutRef.current), []);

  const markUpdateFailed = () => {
    setHasUpdateFailed(true);
    setIsUpdating(false);
  };

  const message = hasUpdateFailed ? copy.failed : copy.message;

  const handleUpdate = async () => {
    setIsUpdating(true);
    setHasUpdateFailed(false);
    window.clearTimeout(reloadTimeoutRef.current);
    try {
      // vite-plugin-pwa resolves without reloading when no new worker takes
      // control, so a reload that never comes counts as a failed update.
      await updateServiceWorker(true);
      reloadTimeoutRef.current = window.setTimeout(
        markUpdateFailed,
        RELOAD_TIMEOUT_MILLISECONDS
      );
    } catch {
      markUpdateFailed();
    }
  };

  return (
    <div
      className="update-banner"
      data-state={isUpdateWaiting ? "open" : "closed"}
    >
      <p className="visually-hidden" role="status">
        {isUpdateWaiting ? message : ""}
      </p>
      <div className="update-banner__panel">
        <span className="update-banner__icon" aria-hidden="true">
          <FiRefreshCw size={18} />
        </span>
        <p className="update-banner__message" aria-hidden="true">
          {message}
        </p>
        <button
          type="button"
          className="button button--primary update-banner__action"
          onClick={() => void handleUpdate()}
          disabled={isUpdating}
        >
          {isUpdating ? copy.updating : copy.update}
        </button>
        <button
          type="button"
          className="icon-button update-banner__dismiss"
          aria-label={copy.dismiss}
          onClick={() => setIsUpdateWaiting(false)}
        >
          <FiX aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
