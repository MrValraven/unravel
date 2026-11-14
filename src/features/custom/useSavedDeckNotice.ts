import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { customCopy } from "./copy";
import { readSavedDeckTitle } from "./navigationState";

/** Shows "Saved <deck>" when the editor or import page sent the player here after a save. */
export const useSavedDeckNotice = (showStatus: (text: string) => void) => {
  const location = useLocation();
  const navigate = useNavigate();
  const savedDeckMessage = useCopy(customCopy).status.savedDeck;
  const savedDeckTitle = readSavedDeckTitle(location.state);
  // StrictMode runs effects twice; the notice belongs to one history entry, so show it once.
  const handledLocationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!savedDeckTitle || handledLocationKeyRef.current === location.key)
      return;
    handledLocationKeyRef.current = location.key;
    showStatus(formatCopy(savedDeckMessage, { title: savedDeckTitle }));
    // Clear the state so a reload or a later visit to this entry stays quiet.
    void navigate(location.pathname, { replace: true, state: null });
  }, [
    savedDeckTitle,
    savedDeckMessage,
    showStatus,
    navigate,
    location.pathname,
    location.key,
  ]);
};
