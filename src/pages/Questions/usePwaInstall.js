import { useState, useEffect, useCallback } from "react";

// Pure: choose which install instructions to show from a user-agent string.
export const detectPlatform = (userAgent = "") => {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
};

// Guarded so it is safe under jsdom, where matchMedia is undefined.
const readIsInstalled = () => {
  if (typeof window === "undefined") return false;
  const standaloneDisplay =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = window.navigator?.standalone === true;
  return Boolean(standaloneDisplay || iosStandalone);
};

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(readIsInstalled);

  const platform =
    typeof navigator !== "undefined"
      ? detectPlatform(navigator.userAgent)
      : "desktop";

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      // Stop Chrome's mini-infobar so we control when to prompt.
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // A captured prompt can only be used once.
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    canPromptNatively: deferredPrompt !== null,
    promptInstall,
    platform,
    isInstalled,
  };
};
