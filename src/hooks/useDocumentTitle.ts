import { useEffect } from "react";
import { useLocation } from "react-router";

const APP_NAME = "Unravel";

/** The production origin. scripts/prerender-decks.ts writes the same one into prerendered pages. */
export const SITE_URL = "https://unravel.tiagocostadev.com";

/**
 * The absolute canonical address of a path: no query, no hash, and no trailing
 * slash except on the root, matching the prerendered pages and sitemap.xml.
 */
export const canonicalUrlFor = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, "");
  return `${SITE_URL}${trimmed === "" ? "/" : trimmed}`;
};

interface DocumentTitleOptions {
  /** Use `title` as the whole tab title, without the " · Unravel" suffix. */
  isFullTitle?: boolean;
}

/** The tab title for a page title, as useDocumentTitle writes it. */
const formatDocumentTitle = (
  title: string,
  { isFullTitle = false }: DocumentTitleOptions = {}
): string => {
  if (!title) return APP_NAME;
  return isFullTitle ? title : `${title} · ${APP_NAME}`;
};

/**
 * Sets the tab title to "<title> · Unravel" ("Unravel" when the title is empty,
 * or `title` alone with `isFullTitle`), and points <link rel="canonical"> and
 * og:url at the current path, so client-side navigation keeps them in step with
 * the prerendered pages.
 */
export function useDocumentTitle(
  title: string,
  { isFullTitle = false }: DocumentTitleOptions = {}
): void {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = formatDocumentTitle(title, { isFullTitle });
  }, [title, isFullTitle]);

  useEffect(() => {
    const url = canonicalUrlFor(pathname);
    document.head
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", url);
    document.head
      .querySelector('meta[property="og:url"]')
      ?.setAttribute("content", url);
  }, [pathname]);
}
