import { useState, useSyncExternalStore } from "react";
import {
  getInstallPromptSnapshot,
  promptInstall,
  subscribeToInstallPrompt,
} from "./installPromptStore";

export type InstallPlatform = "ios" | "android" | "desktop";

export interface PwaInstallState {
  /** True when the browser handed over its own install prompt (Chromium). */
  canPromptNatively: boolean;
  promptInstall: () => Promise<void>;
  platform: InstallPlatform;
  isInstalled: boolean;
}

/**
 * Picks which install instructions to show. iPadOS reports a Mac user agent,
 * so a "Macintosh" with a touch screen counts as iOS.
 */
export const detectPlatform = (
  userAgent = "",
  maxTouchPoints = 0
): InstallPlatform => {
  const lowerCaseUserAgent = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(lowerCaseUserAgent)) return "ios";
  if (/macintosh/.test(lowerCaseUserAgent) && maxTouchPoints > 1) return "ios";
  if (/android/.test(lowerCaseUserAgent)) return "android";
  return "desktop";
};

const readPlatform = (): InstallPlatform =>
  typeof navigator === "undefined"
    ? "desktop"
    : detectPlatform(navigator.userAgent, navigator.maxTouchPoints);

/** Reads the page-wide install prompt store, so a prompt captured before mount is kept. */
export const usePwaInstall = (): PwaInstallState => {
  const { deferredPrompt, isInstalled } = useSyncExternalStore(
    subscribeToInstallPrompt,
    getInstallPromptSnapshot,
    getInstallPromptSnapshot
  );
  const [platform] = useState(readPlatform);

  return {
    canPromptNatively: deferredPrompt !== null,
    promptInstall,
    platform,
    isInstalled,
  };
};
