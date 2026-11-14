/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

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
      VitePWA({
        // "prompt": a freshly deployed service worker installs but waits, so the
        // app can surface a user-triggered "New version available" button
        // (see src/components/UpdateBanner.tsx) and the update runs when the player picks it.
        registerType: "prompt",
        injectRegister: "auto",
        includeAssets: ["logo.svg", "apple-touch-icon.png"],
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,jpg,json,woff2}"],
          // Link preview images are for crawlers, so players never download them.
          // The other entries are source art and leftovers that no page references.
          globIgnores: [
            "og/**",
            "image.jpg",
            "vite.svg",
            "icon.svg",
            "maskable.svg",
          ],
          // Let these files load from the network instead of the app shell.
          navigateFallbackDenylist: [/^\/(sitemap\.xml|robots\.txt|og\/)/],
        },
        manifest: {
          name: "Unravel",
          short_name: "Unravel",
          description:
            "The uncomplicated way of making new friends. A game about people.",
          theme_color: "#232946",
          background_color: "#232946",
          display: "standalone",
          // Table mode lays the card out for landscape, so both orientations are allowed.
          orientation: "any",
          start_url: "/",
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
      // Playwright owns e2e/*.spec.ts, so Vitest only collects unit tests under src.
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
