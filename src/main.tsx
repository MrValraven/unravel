import { StrictMode, useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource-variable/figtree";
import "@fontsource/young-serif";
import "./styles/global.scss";
import App from "./App";
import {
  reportCaughtRootError,
  reportUncaughtRootError,
} from "./components/moduleLoadFailure";
import { decks } from "./content/decks";
import "./features/decks/install/installPromptStore";
import { LocaleProvider } from "./i18n/LocaleContext";
import { migrateLegacyStorage } from "./storage/progress";
import { settingsStore, useSettings, type Settings } from "./storage/settings";

// HTTPS is enforced server-side by Vercel's automatic HTTPS redirect and the
// HSTS header in vercel.json, so the client needs no redirect of its own.

/** Browser chrome colour per theme, matching --color-bg in styles/global.scss. */
const THEME_COLORS = { default: "#232946", dim: "#1d191d" } as const;

// Carries v1 saved progress and the age confirmation over to the v2 keys.
migrateLegacyStorage(decks);

/** Writes the theme, text scale and language onto <html> and the browser chrome colour. */
const applyDocumentSettings = ({ isDimMode, textScale, locale }: Settings) => {
  const theme = isDimMode ? "dim" : "default";
  const root = document.documentElement;
  root.dataset.theme = theme;
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

/** Keeps the document in step with the player's settings: theme, text scale and locale. */
// eslint-disable-next-line react-refresh/only-export-components -- the entry file reloads in full on edit
const Root = () => {
  const [settings] = useSettings();

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

  return (
    <LocaleProvider locale={settings.locale}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
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
