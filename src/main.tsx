import { StrictMode, useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "@fontsource-variable/figtree";
import "@fontsource/young-serif";
import "./styles/global.scss";
import { appRoutes } from "./App";
import {
  reportCaughtRootError,
  reportUncaughtRootError,
} from "./components/moduleLoadFailure";
import { decks } from "./content/decks";
import "./features/decks/install/installPromptStore";
import { LocaleProvider } from "./i18n/LocaleContext";
import { OPEN_URL_MESSAGE_TYPE } from "./storage/dailyCardSchedule";
import { migrateLegacyStorage } from "./storage/progress";
import { refreshDailyCardSchedule, useReminders } from "./storage/reminders";
import {
  settingsStore,
  useSettings,
  type Settings,
  type Theme,
} from "./storage/settings";

// HTTPS is enforced server-side by Vercel's automatic HTTPS redirect and the
// HSTS header in vercel.json, so the client needs no redirect of its own.

/** Browser chrome colour per theme, matching --color-bg in styles/global.scss. */
const THEME_COLORS: Record<Theme, string> = {
  default: "#232946",
  dim: "#1d191d",
  light: "#f7f2ee",
};

/** Native controls and scrollbars follow the page: only the day theme is light. */
const COLOR_SCHEMES: Record<Theme, "dark" | "light"> = {
  default: "dark",
  dim: "dark",
  light: "light",
};

// Carries v1 saved progress and the age confirmation over to the v2 keys.
migrateLegacyStorage(decks);

/** Writes the theme, text scale and language onto <html> and the browser chrome colour. */
const applyDocumentSettings = ({ theme, textScale, locale }: Settings) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute("content", COLOR_SCHEMES[theme]);
  // Matches LocaleProvider, so screen readers pick the right voice before React mounts.
  root.lang = locale === "pt" ? "pt-PT" : "en";
  root.style.setProperty("--text-scale", String(textScale));
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
};

// Apply before React's first render so the app paints in the saved theme. A
// navy frame can still show before this module runs on a slow device.
applyDocumentSettings(settingsStore.get());

// A data router, so links and navigate() calls can opt into view transitions.
const router = createBrowserRouter(appRoutes);

// A view transition that a newer navigation interrupts is skipped on purpose, and
// React Router leaves that AbortError unhandled. It is not a failure, so keep it
// out of the console.
window.addEventListener("unhandledrejection", (event) => {
  const reason: unknown = event.reason;
  if (
    reason instanceof DOMException &&
    reason.name === "AbortError" &&
    /transition/i.test(reason.message)
  ) {
    event.preventDefault();
  }
});

// A tapped reminder notification asks the open window to go to the card of the
// day (src/sw.ts) instead of reloading it, so a game in progress stays put.
navigator.serviceWorker?.addEventListener("message", (event: MessageEvent) => {
  const data = event.data as { type?: unknown; url?: unknown } | null;
  if (
    data?.type === OPEN_URL_MESSAGE_TYPE &&
    typeof data.url === "string" &&
    data.url.startsWith("/")
  ) {
    void router.navigate(data.url);
  }
});

/** Keeps the document in step with the player's settings: theme, text scale and locale. */
// eslint-disable-next-line react-refresh/only-export-components -- the entry file reloads in full on edit
const Root = () => {
  const [settings] = useSettings();
  const { isDailyCardOn } = useReminders();

  useLayoutEffect(() => {
    applyDocumentSettings(settings);
  }, [settings]);

  // Theme colours fade only after the first paint, so a later switch in
  // Settings eases over while the initial load shows the right theme at once.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.documentElement.dataset.themeReady = "true";
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Keeps the reminder's weeks of cards filled from today, in the current language.
  useEffect(() => {
    if (!isDailyCardOn) return;
    const timeout = window.setTimeout(() => {
      void refreshDailyCardSchedule(settings.locale);
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [isDailyCardOn, settings.locale]);

  return (
    <LocaleProvider locale={settings.locale}>
      <RouterProvider router={router} />
    </LocaleProvider>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Unravel: index.html has no #root element to mount into.");
}

// The handlers log like React's defaults, minus a lazy chunk WebKit drops while the page unloads.
ReactDOM.createRoot(rootElement, {
  onCaughtError: reportCaughtRootError,
  onUncaughtError: reportUncaughtRootError,
}).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
