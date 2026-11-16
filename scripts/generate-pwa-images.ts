/**
 * Renders the install images the web app manifest and index.html point at.
 *
 *   npx tsx scripts/generate-pwa-images.ts splash
 *   npx tsx scripts/generate-pwa-images.ts shortcuts
 *   npx tsx scripts/generate-pwa-images.ts screenshots [--base-url=http://localhost:5405]
 *   npx tsx scripts/generate-pwa-images.ts all [--base-url=...]
 *
 *   public/splash/<w>x<h>.png         iOS launch screens, navy with the logo centred,
 *                                      and the matching <link rel="apple-touch-startup-image">
 *                                      tags rewritten between the markers in index.html
 *   public/shortcuts/<name>.png        96x96 icons for the manifest shortcuts
 *   public/screenshots/<page>-<form>.png  install dialog screenshots: home, decks and
 *                                      play, narrow 1080x2340 and wide 1920x1080
 *
 * Screenshots need the app running: start `npx vite --port 5405` first (any port
 * works with --base-url). Uses the Playwright Chromium installed on this machine.
 * None of these files are precached (vite.config.ts), because only the operating
 * system reads them. Run it again after a visible UI change and commit the PNGs.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FiCompass, FiPlay, FiPlus, FiSun } from "react-icons/fi";
import type { IconBaseProps } from "react-icons";
import { chromium, type Browser, type Page } from "@playwright/test";
import packageJson from "../package.json";

const repoRoot = resolve(import.meta.dirname, "..");
const publicDirectory = join(repoRoot, "public");
const indexHtmlPath = join(repoRoot, "index.html");

/** The Unravel navy and the brand pink, as in src/styles/_tokens.scss. */
const NAVY = "#232946";
const PINK = "#eebbc3";

// ---- iOS launch screens ----

interface AppleDevice {
  /** Who uses this size, for the comment next to its tag. */
  devices: string;
  /** CSS pixels in portrait. */
  width: number;
  height: number;
  pixelRatio: number;
}

/** Current iPhone and iPad screens in portrait. iOS picks the tag whose media query matches exactly. */
const appleDevices: AppleDevice[] = [
  {
    devices: "iPhone 16 Pro Max, 17 Pro Max",
    width: 440,
    height: 956,
    pixelRatio: 3,
  },
  { devices: "iPhone Air", width: 420, height: 912, pixelRatio: 3 },
  {
    devices: "iPhone 16 Pro, 17, 17 Pro",
    width: 402,
    height: 874,
    pixelRatio: 3,
  },
  {
    devices: "iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus",
    width: 430,
    height: 932,
    pixelRatio: 3,
  },
  {
    devices: "iPhone 14 Pro, 15, 15 Pro, 16",
    width: 393,
    height: 852,
    pixelRatio: 3,
  },
  {
    devices: "iPhone 12 Pro Max, 13 Pro Max, 14 Plus",
    width: 428,
    height: 926,
    pixelRatio: 3,
  },
  { devices: "iPhone 12, 13, 14, 16e", width: 390, height: 844, pixelRatio: 3 },
  {
    devices: "iPhone X, XS, 11 Pro, 12 mini, 13 mini",
    width: 375,
    height: 812,
    pixelRatio: 3,
  },
  {
    devices: "iPhone XS Max, 11 Pro Max",
    width: 414,
    height: 896,
    pixelRatio: 3,
  },
  { devices: "iPhone XR, 11", width: 414, height: 896, pixelRatio: 2 },
  { devices: "iPhone 8 Plus", width: 414, height: 736, pixelRatio: 3 },
  {
    devices: "iPhone SE 2nd and 3rd gen, 8",
    width: 375,
    height: 667,
    pixelRatio: 2,
  },
  { devices: "iPad Pro 13 (M4)", width: 1032, height: 1376, pixelRatio: 2 },
  {
    devices: "iPad Pro 12.9, iPad Air 13",
    width: 1024,
    height: 1366,
    pixelRatio: 2,
  },
  { devices: "iPad Pro 11 (M4)", width: 834, height: 1210, pixelRatio: 2 },
  { devices: "iPad Pro 11", width: 834, height: 1194, pixelRatio: 2 },
  {
    devices: "iPad Air 11, iPad 10th gen and later",
    width: 820,
    height: 1180,
    pixelRatio: 2,
  },
  {
    devices: "iPad Air 3rd gen, iPad Pro 10.5",
    width: 834,
    height: 1112,
    pixelRatio: 2,
  },
  { devices: "iPad 7th to 9th gen", width: 810, height: 1080, pixelRatio: 2 },
  {
    devices: "iPad mini 6th gen and later",
    width: 744,
    height: 1133,
    pixelRatio: 2,
  },
  {
    devices: "iPad mini 5th gen, iPad 6th gen",
    width: 768,
    height: 1024,
    pixelRatio: 2,
  },
];

const splashFileName = ({ width, height, pixelRatio }: AppleDevice) =>
  `${width * pixelRatio}x${height * pixelRatio}.png`;

const splashMediaQuery = ({ width, height, pixelRatio }: AppleDevice) =>
  `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${pixelRatio}) and (orientation: portrait)`;

const SPLASH_START_MARKER =
  "<!-- iOS launch screens: written by scripts/generate-pwa-images.ts -->";
const SPLASH_END_MARKER = "<!-- /iOS launch screens -->";

const splashPage = (logoSvg: string) => `<!doctype html>
<html><head><style>
  html, body { margin: 0; height: 100%; background: ${NAVY}; }
  body { display: grid; place-items: center; }
  svg { width: clamp(112px, 28vmin, 220px); height: auto; }
</style></head><body>${logoSvg}</body></html>`;

const writeSplashLinks = () => {
  const html = readFileSync(indexHtmlPath, "utf8");
  const start = html.indexOf(SPLASH_START_MARKER);
  const end = html.indexOf(SPLASH_END_MARKER);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `index.html is missing the launch screen markers "${SPLASH_START_MARKER}" and "${SPLASH_END_MARKER}", so the tags have nowhere to go.`
    );
  }
  const indent = "    ";
  const links = appleDevices
    .map(
      (device) =>
        `${indent}<!-- ${device.devices} -->\n` +
        `${indent}<link\n` +
        `${indent}  rel="apple-touch-startup-image"\n` +
        `${indent}  href="/splash/${splashFileName(device)}"\n` +
        `${indent}  media="${splashMediaQuery(device)}"\n` +
        `${indent}/>\n`
    )
    .join("");
  const next =
    html.slice(0, start + SPLASH_START_MARKER.length) +
    "\n" +
    links +
    indent +
    html.slice(end);
  writeFileSync(indexHtmlPath, next);
  console.log(`Wrote ${appleDevices.length} launch screen tags to index.html`);
};

const renderSplashScreens = async (browser: Browser) => {
  const outputDirectory = join(publicDirectory, "splash");
  mkdirSync(outputDirectory, { recursive: true });
  // The favicon draws the mark as a white outline; on a launch screen it reads
  // better filled in the brand pink, like the app icon's mark.
  const logoSvg = readFileSync(join(publicDirectory, "logo.svg"), "utf8")
    .replaceAll(`fill="${NAVY}"`, `fill="${PINK}"`)
    .replaceAll('stroke="#ffffff"', 'stroke="none"');
  for (const device of appleDevices) {
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: device.pixelRatio,
    });
    await page.setContent(splashPage(logoSvg));
    const outputPath = join(outputDirectory, splashFileName(device));
    await page.screenshot({ path: outputPath, type: "png" });
    await page.close();
    console.log(`Wrote ${outputPath}`);
  }
  writeSplashLinks();
};

// ---- Shortcut icons ----

const SHORTCUT_ICON_SIZE = 96;

const shortcutIcons: { name: string; icon: ComponentType<IconBaseProps> }[] = [
  { name: "continue", icon: FiPlay },
  { name: "today", icon: FiSun },
  { name: "finder", icon: FiCompass },
  { name: "create", icon: FiPlus },
];

const shortcutPage = (iconSvg: string) => `<!doctype html>
<html><head><style>
  html, body { margin: 0; width: 100%; height: 100%; background: ${NAVY}; }
  body { display: grid; place-items: center; }
</style></head><body>${iconSvg}</body></html>`;

const renderShortcutIcons = async (browser: Browser) => {
  const outputDirectory = join(publicDirectory, "shortcuts");
  mkdirSync(outputDirectory, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: SHORTCUT_ICON_SIZE, height: SHORTCUT_ICON_SIZE },
    deviceScaleFactor: 1,
  });
  for (const { name, icon } of shortcutIcons) {
    // Half the tile, so a launcher's circle mask leaves room around the glyph.
    const iconSvg = renderToStaticMarkup(
      createElement(icon, { size: 48, color: PINK, strokeWidth: 2.25 })
    );
    await page.setContent(shortcutPage(iconSvg));
    const outputPath = join(outputDirectory, `${name}.png`);
    await page.screenshot({ path: outputPath, type: "png" });
    console.log(`Wrote ${outputPath}`);
  }
  await page.close();
};

// ---- Install screenshots ----

const formFactors = {
  // 360x780 CSS pixels at 3x: 1080x2340, a common Android phone.
  narrow: { width: 360, height: 780, deviceScaleFactor: 3 },
  wide: { width: 1920, height: 1080, deviceScaleFactor: 1 },
} as const;

/** Saved state for a returning player, so no intro or What's new dialog covers the page. */
const seededStorage: Record<string, string> = {
  "unravel:v2:settings": JSON.stringify({
    locale: "en",
    textScale: 1,
    theme: "default",
    isHapticsEnabled: true,
    hasSeenIntro: true,
    lastSeenVersion: packageJson.version,
  }),
};

/** A friendly, all-ages deck for the play screenshot. */
const PLAY_DECK_ID = "first-date";

const settle = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Lets entrance animations finish.
  await page.waitForTimeout(900);
};

const startGame = async (page: Page) => {
  await page.goto(`/play/${PLAY_DECK_ID}`);
  await settle(page);
  const startButton = page
    .getByRole("button", { name: /^(start|start game|play|let's play)/i })
    .first();
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
    await settle(page);
  }
};

const renderScreenshots = async (browser: Browser, baseUrl: string) => {
  const outputDirectory = join(publicDirectory, "screenshots");
  mkdirSync(outputDirectory, { recursive: true });
  for (const [formFactor, viewport] of Object.entries(formFactors)) {
    const context = await browser.newContext({
      baseURL: baseUrl,
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: formFactor === "narrow",
      hasTouch: formFactor === "narrow",
      colorScheme: "dark",
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    await context.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) {
        window.localStorage.setItem(key, value);
      }
    }, seededStorage);
    const page = await context.newPage();
    const shots: { name: string; open: () => Promise<void> }[] = [
      {
        name: "home",
        open: async () => {
          await page.goto("/");
          await settle(page);
        },
      },
      {
        name: "decks",
        open: async () => {
          await page.goto("/decks");
          await settle(page);
        },
      },
      { name: "play", open: () => startGame(page) },
    ];
    for (const shot of shots) {
      await shot.open();
      const outputPath = join(
        outputDirectory,
        `${shot.name}-${formFactor}.png`
      );
      await page.screenshot({ path: outputPath, type: "png" });
      console.log(`Wrote ${outputPath}`);
    }
    await context.close();
  }
};

// ---- Entry ----

const main = async (): Promise<void> => {
  const [target = "all", ...flags] = process.argv.slice(2);
  const baseUrlFlag = flags.find((flag) => flag.startsWith("--base-url="));
  const baseUrl =
    baseUrlFlag?.slice("--base-url=".length) ?? "http://localhost:5405";
  const targets = ["splash", "shortcuts", "screenshots", "all"];
  if (!targets.includes(target)) {
    throw new Error(
      `Unknown target "${target}". Use one of: ${targets.join(", ")}.`
    );
  }

  const browser = await chromium.launch();
  try {
    if (target === "splash" || target === "all")
      await renderSplashScreens(browser);
    if (target === "shortcuts" || target === "all")
      await renderShortcutIcons(browser);
    if (target === "screenshots" || target === "all") {
      try {
        await fetch(baseUrl);
      } catch {
        throw new Error(
          `Nothing answers at ${baseUrl}, so the screenshots have no app to capture. Start it with "npx vite --port 5405" or pass --base-url.`
        );
      }
      await renderScreenshots(browser, baseUrl);
    }
  } finally {
    await browser.close();
  }
};

main().catch((error: unknown) => {
  console.error("Could not render the install images:", error);
  process.exitCode = 1;
});
