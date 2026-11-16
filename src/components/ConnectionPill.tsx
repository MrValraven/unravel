import { useSyncExternalStore } from "react";
import { FiWifiOff } from "react-icons/fi";
import { useCopy } from "../i18n/useCopy";
import { sharedCopy } from "./copy";
import "./ConnectionPill.scss";

const subscribeToConnection = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getIsOffline = () => !navigator.onLine;
const getIsOfflineOnServer = () => false;

/** A quiet "Offline" pill at the top while the browser has no connection. The decks keep working. */
export const ConnectionPill = () => {
  const copy = useCopy(sharedCopy).offline;
  const isOffline = useSyncExternalStore(
    subscribeToConnection,
    getIsOffline,
    getIsOfflineOnServer
  );

  return (
    <div
      className="connection-pill"
      data-state={isOffline ? "offline" : "online"}
    >
      <p className="visually-hidden" role="status">
        {isOffline ? copy.offline : ""}
      </p>
      <p className="connection-pill__label" aria-hidden="true">
        <FiWifiOff aria-hidden="true" size={14} />
        {copy.offline}
      </p>
    </div>
  );
};

export default ConnectionPill;
