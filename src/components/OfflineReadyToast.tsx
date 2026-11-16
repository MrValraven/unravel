import { useEffect } from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";
import { useCopy } from "../i18n/useCopy";
import { sharedCopy } from "./copy";
import "./OfflineReadyToast.scss";

/** Long enough to read both lines, short enough to stay out of the way. */
const AUTO_HIDE_MILLISECONDS = 6000;

interface OfflineReadyToastProps {
  isOpen: boolean;
  onDismiss: () => void;
}

/**
 * "Ready to play offline": shown once, when the service worker first finishes
 * saving the app on this device. UpdateBanner owns the service worker
 * registration and opens it.
 */
export const OfflineReadyToast = ({
  isOpen,
  onDismiss,
}: OfflineReadyToastProps) => {
  const copy = useCopy(sharedCopy).offline;

  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(onDismiss, AUTO_HIDE_MILLISECONDS);
    return () => window.clearTimeout(timeout);
  }, [isOpen, onDismiss]);

  return (
    <div className="offline-toast" data-state={isOpen ? "open" : "closed"}>
      <p className="visually-hidden" role="status">
        {isOpen ? `${copy.ready}. ${copy.readyDetail}` : ""}
      </p>
      <div className="offline-toast__panel" aria-hidden={!isOpen}>
        <span className="offline-toast__icon" aria-hidden="true">
          <FiCheckCircle size={18} />
        </span>
        <p className="offline-toast__text" aria-hidden="true">
          <span className="offline-toast__title">{copy.ready}</span>
          <span className="offline-toast__detail">{copy.readyDetail}</span>
        </p>
        <button
          type="button"
          className="icon-button offline-toast__dismiss"
          aria-label={copy.dismissReady}
          onClick={onDismiss}
          tabIndex={isOpen ? undefined : -1}
        >
          <FiX aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
};

export default OfflineReadyToast;
