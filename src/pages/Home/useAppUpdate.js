import { useRegisterSW } from "virtual:pwa-register/react";

// Surfaces vite-plugin-pwa's update lifecycle as a small, UI-friendly shape.
// In `prompt` mode a freshly deployed service worker installs but waits; the
// hook reports that wait as `updateAvailable`, and `applyUpdate` activates the
// new worker and reloads the page into it.
export const useAppUpdate = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return {
    updateAvailable: needRefresh,
    applyUpdate: () => updateServiceWorker(true),
  };
};
