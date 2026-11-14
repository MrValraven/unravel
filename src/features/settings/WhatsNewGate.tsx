import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { settingsStore, useSettings } from "../../storage/settings";
import { WhatsNewDialog } from "./WhatsNewDialog";
import { compareVersions, getReleasesSince } from "./whatsNew";

const APP_VERSION = __APP_VERSION__;

/** The play screen itself; the deck end page at /play/:deckId/done can show the notes. */
const PLAY_SCREEN_PATTERN = /^\/play\/[^/]+$/;

/** True when the running app is newer than the stored version, or nothing is stored yet. */
const isRunningVersionNewer = (lastSeenVersion: string): boolean =>
  lastSeenVersion === "" || compareVersions(APP_VERSION, lastSeenVersion) > 0;

/** Stores the running version only when it moves the stored one forward. */
const storeRunningVersion = (): void => {
  if (isRunningVersionNewer(settingsStore.get().lastSeenVersion)) {
    settingsStore.set((previous) => ({
      ...previous,
      lastSeenVersion: APP_VERSION,
    }));
  }
};

/**
 * Mounted once in App. After an update it shows the notes for every release the
 * player has not seen, once, and stores the version when they close it. A first
 * visit, or an update with no notes, stores the version quietly. A stale tab on an
 * older version leaves the stored version alone. The dialog waits while a card is
 * on screen so it never covers one.
 */
const WhatsNewGate = () => {
  const [settings] = useSettings();
  const { pathname } = useLocation();
  // Taken once at start-up, so the notes stay on screen while the dialog animates out.
  const [pendingReleases] = useState(() =>
    getReleasesSince(settingsStore.get().lastSeenVersion, APP_VERSION)
  );

  const lastSeenVersion = settings.lastSeenVersion;
  const isFirstVisit = lastSeenVersion === "";
  const isBehindRunningVersion = isRunningVersionNewer(lastSeenVersion);
  const hasNotesToShow = pendingReleases.length > 0;
  const isOnPlayScreen = PLAY_SCREEN_PATTERN.test(pathname);
  const shouldStoreQuietly =
    isBehindRunningVersion && (isFirstVisit || !hasNotesToShow);
  const isOpen =
    isBehindRunningVersion &&
    !isFirstVisit &&
    hasNotesToShow &&
    !isOnPlayScreen;

  useEffect(() => {
    if (shouldStoreQuietly) storeRunningVersion();
  }, [shouldStoreQuietly]);

  return (
    <WhatsNewDialog
      isOpen={isOpen}
      onClose={storeRunningVersion}
      releaseList={pendingReleases}
    />
  );
};

export default WhatsNewGate;
