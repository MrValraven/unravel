import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      // "prompt": a freshly deployed service worker installs but waits, so the
      // Home screen can surface a user-triggered "New version available" button
      // (see src/pages/Home/useAppUpdate.js) instead of silently auto-updating.
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: ["logo.svg", "apple-touch-icon.png", "image.jpg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,jpg,json,woff2}"],
      },
      manifest: {
        name: "Unravel",
        short_name: "Unravel",
        description:
          "The uncomplicated way of making new friends — a game about people.",
        theme_color: "#232946",
        background_color: "#232946",
        display: "standalone",
        orientation: "portrait",
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
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
