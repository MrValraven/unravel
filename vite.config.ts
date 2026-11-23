/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

/** The Latin Young Serif face: card text, so the first card paints in it instead of a fallback. */
const CARD_FONT_FILE_PATTERN = /young-serif-latin-400-normal-[\w-]+\.woff2$/;

/**
 * Adds `<link rel="preload" as="font">` for the hashed card font to the built index.html,
 * so the browser fetches it with the CSS instead of after the first layout. The deck pages
 * that scripts/prerender-decks.ts writes start from this index.html and keep the link.
 */
const preloadCardFont = (): Plugin => ({
  name: "unravel:preload-card-font",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler(_html, context) {
      const fontFileName = Object.keys(context.bundle ?? {}).find((fileName) =>
        CARD_FONT_FILE_PATTERN.test(fileName)
      );
      if (!fontFileName) {
        throw new Error(
          "Unravel: the build has no young-serif-latin-400-normal woff2 file to preload. Check the @fontsource/young-serif import in src/main.tsx."
        );
      }
      return [
        {
          tag: "link",
          attrs: {
            rel: "preload",
            href: `/${fontFileName}`,
            as: "font",
            type: "font/woff2",
            crossorigin: "",
          },
          injectTo: "head",
        },
      ];
    },
  },
});

/** Files under public/ that only the operating system or app stores read, so players never download them. */
const NOT_PRECACHED_PUBLIC_FILES = [
  // Link preview images are for crawlers.
  "og/**",
  // Install dialog screenshots, iOS launch screens and home screen shortcut icons.
  "screenshots/**",
  "splash/**",
  "shortcuts/**",
  // Source art and leftovers that no page references.
  "image.jpg",
  "vite.svg",
  "icon.svg",
  "maskable.svg",
];

const shortcutIcon = (name: string) => [
  {
    src: `shortcuts/${name}.png`,
    sizes: "96x96",
    type: "image/png",
    purpose: "any",
  },
];

const screenshot = (
  name: string,
  formFactor: "narrow" | "wide",
  label: string
) => ({
  src: `screenshots/${name}-${formFactor}.png`,
  sizes: formFactor === "narrow" ? "1080x2340" : "1920x1080",
  type: "image/png",
  form_factor: formFactor,
  label,
});

const SCREENSHOT_LABELS = {
  home: "Home with the card of the day",
  decks: "Pick a deck for friends, dates or partners",
  play: "A question card in play",
} as const;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // HTTPS is opt-in (`npm run dev:https`) so the default dev server has no certificate warning.
  const isHttpsEnabled = loadEnv(mode, process.cwd(), "").HTTPS === "1";
  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [
      react(),
      ...(isHttpsEnabled ? [basicSsl()] : []),
      preloadCardFont(),
      VitePWA({
        // "prompt": a freshly deployed service worker installs but waits, so the
        // app can surface a user-triggered "New version available" button
        // (see src/components/UpdateBanner.tsx) and the update runs when the player picks it.
        registerType: "prompt",
        injectRegister: "auto",
        // src/sw.ts keeps the generated worker's precache, navigation fallback and
        // prompt-mode updates, and adds the daily card reminder (Periodic Background Sync).
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        includeAssets: ["logo.svg", "apple-touch-icon.png"],
        // The globs below already precache the app icons; this keeps the shortcut
        // icons, which only the launcher reads, out of the precache too.
        includeManifestIcons: false,
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,jpg,json,woff2}"],
          globIgnores: NOT_PRECACHED_PUBLIC_FILES,
          // One classic script with workbox inlined, like the generated worker it replaces.
          rollupFormat: "iife",
        },
        manifest: {
          id: "/",
          name: "Unravel",
          short_name: "Unravel",
          description:
            "A card game of good questions for friends, first dates and partners.",
          lang: "en",
          dir: "ltr",
          categories: ["games", "social", "lifestyle"],
          theme_color: "#232946",
          background_color: "#232946",
          display: "standalone",
          // Table mode lays the card out for landscape, so both orientations are allowed.
          orientation: "any",
          start_url: "/",
          // A home screen shortcut or notification reuses the open window instead of a second one.
          launch_handler: { client_mode: ["navigate-existing", "auto"] },
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          // Rendered by scripts/generate-pwa-images.ts.
          shortcuts: [
            {
              name: "Continue game",
              short_name: "Continue",
              description:
                "Pick up the game you left, on the card you stopped at",
              url: "/continue",
              icons: shortcutIcon("continue"),
            },
            {
              name: "Card of the day",
              short_name: "Today",
              description: "Read today's card, the same for everyone",
              url: "/#today",
              icons: shortcutIcon("today"),
            },
            {
              name: "Find a deck",
              short_name: "Find",
              description: "Answer a few questions and get a deck for tonight",
              url: "/finder",
              icons: shortcutIcon("finder"),
            },
            {
              name: "Create a deck",
              short_name: "Create",
              description: "Write your own questions and challenges",
              url: "/custom/new",
              icons: shortcutIcon("create"),
            },
          ],
          screenshots: [
            screenshot("home", "narrow", SCREENSHOT_LABELS.home),
            screenshot("decks", "narrow", SCREENSHOT_LABELS.decks),
            screenshot("play", "narrow", SCREENSHOT_LABELS.play),
            screenshot("home", "wide", SCREENSHOT_LABELS.home),
            screenshot("decks", "wide", SCREENSHOT_LABELS.decks),
            screenshot("play", "wide", SCREENSHOT_LABELS.play),
          ],
        },
      }),
    ],
    server: {
      host: true,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      css: false,
      // Playwright owns e2e/*.spec.ts, so Vitest only collects unit tests under src and scripts.
      include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    },
  };
});
