import { useEffect, useRef } from "react";

/** Read by PlaySetup.scss for the page's scroll padding. */
export const STICKY_FOOTER_HEIGHT_PROPERTY = "--play-setup-footer-height";

/**
 * Publishes the sticky Start bar's height on the root element while the step
 * shows. The page reserves that much scroll padding, so a control reached with
 * Tab or scrolled into view lands above the bar instead of behind it.
 */
export function useStickyFooterHeight<Target extends HTMLElement>() {
  const footerRef = useRef<Target>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const rootStyle = document.documentElement.style;
    if (!footer) return;
    const publishHeight = () =>
      rootStyle.setProperty(
        STICKY_FOOTER_HEIGHT_PROPERTY,
        `${Math.ceil(footer.getBoundingClientRect().height)}px`
      );
    publishHeight();
    if (typeof ResizeObserver === "undefined") {
      return () => rootStyle.removeProperty(STICKY_FOOTER_HEIGHT_PROPERTY);
    }
    const observer = new ResizeObserver(publishHeight);
    observer.observe(footer);
    return () => {
      observer.disconnect();
      rootStyle.removeProperty(STICKY_FOOTER_HEIGHT_PROPERTY);
    };
  }, []);

  return footerRef;
}
