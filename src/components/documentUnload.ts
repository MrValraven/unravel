// WebKit rejects a pending lazy import() while the page is being replaced (reload or
// navigation to a new document). The closing page should stay quiet about it, because the
// incoming page is fine. The flag turns on at pagehide or beforeunload and off again when a
// page restored from the back-forward cache fires pageshow.
let isUnloadInProgress = false;

const markDocumentUnloading = () => {
  isUnloadInProgress = true;
};

const markDocumentVisible = () => {
  isUnloadInProgress = false;
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", markDocumentUnloading);
  window.addEventListener("beforeunload", markDocumentUnloading);
  window.addEventListener("pageshow", markDocumentVisible);
  import.meta.hot?.dispose(() => {
    window.removeEventListener("pagehide", markDocumentUnloading);
    window.removeEventListener("beforeunload", markDocumentUnloading);
    window.removeEventListener("pageshow", markDocumentVisible);
  });
}

/** True from pagehide or beforeunload until a back-forward cache restore fires pageshow. */
export const isDocumentUnloading = (): boolean => isUnloadInProgress;
