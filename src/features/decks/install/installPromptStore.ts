/**
 * Holds the browser's install prompt for the whole page load. Chromium fires
 * `beforeinstallprompt` once, often before any lazy page mounts, so the
 * listeners register when this module is imported (eagerly, from main.tsx).
 */

/** Chrome's install prompt event, which TypeScript's DOM types do not ship. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** iOS Safari exposes `navigator.standalone` inside a home-screen app. */
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export interface InstallPromptSnapshot {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
}

/** Safe under jsdom, where matchMedia is undefined. */
const readIsInstalled = (): boolean => {
  if (typeof window === "undefined") return false;
  const isStandaloneDisplay =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone =
    (window.navigator as NavigatorWithStandalone | undefined)?.standalone ===
    true;
  return isStandaloneDisplay || isIosStandalone;
};

let snapshot: InstallPromptSnapshot = {
  deferredPrompt: null,
  isInstalled: readIsInstalled(),
};
const listeners = new Set<() => void>();

const update = (patch: Partial<InstallPromptSnapshot>) => {
  snapshot = { ...snapshot, ...patch };
  for (const listener of Array.from(listeners)) listener();
};

const handleBeforeInstallPrompt = (event: Event) => {
  // Stop Chrome's mini-infobar so the app decides when to prompt.
  event.preventDefault();
  update({ deferredPrompt: event as BeforeInstallPromptEvent });
};

const handleAppInstalled = () => {
  update({ deferredPrompt: null, isInstalled: true });
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
}

// A hot reload re-runs this module, so the old copy drops its listeners first.
import.meta.hot?.dispose(() => {
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.removeEventListener("appinstalled", handleAppInstalled);
});

export const getInstallPromptSnapshot = (): InstallPromptSnapshot => snapshot;

export const subscribeToInstallPrompt = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Shows the browser's own install prompt once; the captured event is cleared afterwards. */
export const promptInstall = async (): Promise<void> => {
  const { deferredPrompt } = snapshot;
  if (!deferredPrompt) return;
  // A captured prompt can only be used once, so it leaves the store right away.
  update({ deferredPrompt: null });
  try {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
  } catch {
    // The browser refused to show its prompt; the written steps still apply.
  }
};
