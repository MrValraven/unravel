let hasRequested = false;

/** iOS Safari exposes `navigator.standalone` inside a home-screen app. */
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/** True in the installed app: a standalone window, or an iOS home-screen app. */
const isRunningInstalled = (): boolean => {
  try {
    const isStandaloneDisplay =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches;
    const isIosStandalone =
      (navigator as NavigatorWithStandalone).standalone === true;
    return isStandaloneDisplay || isIosStandalone;
  } catch {
    return false;
  }
};

/**
 * Asks the browser not to clear this site's storage when space runs low. Only the
 * installed app asks, so a browser tab never shows a permission prompt. Called once
 * per page load, after the player first saves something worth keeping. The browser
 * may refuse or have no storage manager; neither is an error, so nothing is reported.
 */
export function requestPersistentStorage(): void {
  if (hasRequested || !isRunningInstalled()) return;
  hasRequested = true;
  try {
    const request = navigator.storage?.persist?.();
    request?.catch(() => {});
  } catch {
    // Storage manager unavailable or blocked: the data stays as it was.
  }
}
