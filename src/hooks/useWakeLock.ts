import { useEffect } from "react";

/**
 * Keeps the screen awake while the calling component is mounted and the page is visible.
 * The browser drops the lock whenever the page is hidden, so it is asked for again each
 * time the page comes back. Does nothing where the Screen Wake Lock API is missing, and
 * stays quiet when the browser refuses (battery saver, a permissions policy).
 */
export function useWakeLock(isActive = true): void {
  useEffect(() => {
    if (!isActive || typeof navigator === "undefined") return;
    const wakeLock = (navigator as Partial<Navigator>).wakeLock;
    if (!wakeLock || typeof wakeLock.request !== "function") return;

    let sentinel: WakeLockSentinel | null = null;
    let isRequesting = false;
    let isDisposed = false;

    const release = (lock: WakeLockSentinel) => {
      if (lock.released) return;
      lock.release().catch(() => {
        // Already released by the browser.
      });
    };

    const request = async () => {
      if (isDisposed || isRequesting) return;
      if (document.visibilityState !== "visible") return;
      if (sentinel && !sentinel.released) return;
      isRequesting = true;
      try {
        const nextSentinel = await wakeLock.request("screen");
        if (isDisposed) release(nextSentinel);
        else sentinel = nextSentinel;
      } catch {
        // Refused: the screen simply follows its usual timeout.
      } finally {
        isRequesting = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isDisposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (sentinel) release(sentinel);
      sentinel = null;
    };
  }, [isActive]);
}
