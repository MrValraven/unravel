import { useEffect } from "react";

const APP_NAME = "Unravel";

/** Sets the tab title to "<title> · Unravel", or "Unravel" when the title is empty. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
