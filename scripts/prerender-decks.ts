/**
 * Runs after `vite build` (npm "postbuild") so search engines and link previews
 * see each deck's own title, description and share image.
 *
 *   npx tsx scripts/prerender-decks.ts [--dist <dir>]
 *
 * For every live deck it writes dist/decks/<id>/index.html and dist/decks/<id>.html
 * (the same page; vercel.json cleanUrls serves the second one at /decks/<id>).
 * Each page is dist/index.html with its own <title>, description, canonical,
 * Open Graph and Twitter tags, and a <noscript> summary with up to five sample
 * cards. 18+ decks get robots noindex, the shared adults image and no samples.
 * It also writes dist/sitemap.xml and dist/404.html (a copy of index.html, so
 * unknown paths still boot the app and show its own not found page).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { deckCategories, decks } from "../src/content/decks";
import type { Card, Deck } from "../src/content/types";

const SITE_URL = "https://unravel.tiagocostadev.com";
const MAX_SAMPLE_CARDS = 5;
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const repoRoot = resolve(import.meta.dirname, "..");
const publicDirectory = join(repoRoot, "public");

const readDistDirectory = (): string => {
  const flagIndex = process.argv.indexOf("--dist");
  if (flagIndex === -1) return join(repoRoot, "dist");
  const value = process.argv[flagIndex + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("The --dist flag needs a directory path after it.");
  }
  return resolve(value);
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const deckUrl = (deck: Deck): string => `${SITE_URL}/decks/${deck.id}`;

/** Deck images live in public/og/decks; a deck without one falls back to the app image. */
const ogImagePath = (deck: Deck): string => {
  if (deck.isAdult) return "/og/adults.png";
  const deckImagePath = `/og/decks/${deck.id}.png`;
  if (existsSync(join(publicDirectory, deckImagePath))) return deckImagePath;
  console.warn(
    `No share image for "${deck.id}" at public${deckImagePath}, using ${APP_IMAGE_PATH}. Run npm run og:images to create it.`
  );
  return APP_IMAGE_PATH;
};

const categoryTitle = (deck: Deck): string =>
  deckCategories.find((category) => category.key === deck.category)?.title.en ??
  "";

const formatCardCount = (count: number): string =>
  count === 1 ? "1 card" : `${count} cards`;

/** Gentlest cards first, keeping deck order inside each level. */
const pickSampleCards = (deck: Deck): Card[] =>
  [...deck.cards]
    .sort((first, second) => first.level - second.level)
    .slice(0, MAX_SAMPLE_CARDS);

/** Tags the deck pages replace. Everything else in dist/index.html stays as it is. */
const replacedHeadTags: { label: string; pattern: RegExp }[] = [
  { label: "<title>", pattern: /<title>[\s\S]*?<\/title>\s*/g },
  {
    label: '<meta name="description">',
    pattern: /<meta\s+name="description"[^>]*>\s*/g,
  },
  {
    label: '<meta name="robots">',
    pattern: /<meta\s+name="robots"[^>]*>\s*/g,
  },
  {
    label: '<link rel="canonical">',
    pattern: /<link\s+rel="canonical"[^>]*>\s*/g,
  },
  {
    label: '<meta property="og:*">',
    pattern: /<meta\s+property="og:[^"]*"[^>]*>\s*/g,
  },
  {
    label: '<meta name="twitter:*">',
    pattern: /<meta\s+name="twitter:[^"]*"[^>]*>\s*/g,
  },
  {
    label: "the Open Graph and Twitter comments",
    pattern: /<!--\s*(?:Open Graph|Twitter)[^>]*-->\s*/g,
  },
];

/** The deck tags go right after this tag, near the top of <head>. */
const viewportMetaPattern = /<meta\s+name="viewport"[^>]*>\n?/;

/** Removes the app-wide meta tags. Fails loudly when index.html changed shape. */
const stripAppHeadTags = (indexHtml: string): string => {
  let html = indexHtml;
  for (const { label, pattern } of replacedHeadTags) {
    if (!pattern.test(html)) {
      throw new Error(
        `dist/index.html has no ${label} tag to replace. Update replacedHeadTags in scripts/prerender-decks.ts to match index.html.`
      );
    }
    pattern.lastIndex = 0;
    html = html.replace(pattern, "");
  }
  if (!viewportMetaPattern.test(html) || !html.includes('<div id="root">')) {
    throw new Error(
      'dist/index.html is missing <meta name="viewport"> or <div id="root">, so the deck pages cannot be built from it.'
    );
  }
  return html;
};

/** Neutral copy for 18+ deck pages, so previews and search snippets stay tame. */
const ADULT_DECK_DESCRIPTION =
  "An 18+ conversation deck for consenting adults.";
const APP_IMAGE_PATH = "/og/unravel.png";

/** Everything one prerendered page needs in its <head>. */
interface PageMeta {
  /** Site path without a trailing slash, e.g. "/decks/first-date". */
  path: string;
  title: string;
  description: string;
  imagePath: string;
  imageAlt: string;
  isIndexable: boolean;
}

const deckDescription = (deck: Deck): string =>
  deck.isAdult ? ADULT_DECK_DESCRIPTION : deck.description.en;

const deckPageMeta = (deck: Deck): PageMeta => ({
  path: `/decks/${deck.id}`,
  title: `${deck.title.en} · Unravel`,
  description: deckDescription(deck),
  imagePath: ogImagePath(deck),
  imageAlt: deck.isAdult
    ? "Unravel decks for adults, 18 and over"
    : `${deck.title.en}, a deck of Unravel`,
  isIndexable: !deck.isAdult,
});

const appImageAlt = "Unravel, a card game of good questions";

const deckListMeta: PageMeta = {
  path: "/decks",
  title: "All decks · Unravel",
  description:
    "Every Unravel deck in one place: questions and challenges for new friends, first dates, partners and groups.",
  imagePath: APP_IMAGE_PATH,
  imageAlt: appImageAlt,
  isIndexable: true,
};

const finderMeta: PageMeta = {
  path: "/finder",
  title: "Find a deck · Unravel",
  description:
    "Tell Unravel who you are with and the mood you want, and it suggests the decks that fit.",
  imagePath: APP_IMAGE_PATH,
  imageAlt: appImageAlt,
  isIndexable: true,
};

const buildHeadTags = (meta: PageMeta): string => {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(`${SITE_URL}${meta.path}`);
  const imageUrl = escapeHtml(`${SITE_URL}${meta.imagePath}`);
  const imageAlt = escapeHtml(meta.imageAlt);
  const robots = meta.isIndexable ? "index, follow" : "noindex";
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${imageUrl}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Unravel" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
  ]
    .map((tag) => `    ${tag}`)
    .join("\n");
};

/** Wraps body lines (already escaped) in an indented <noscript><main> block. */
const wrapNoscript = (bodyLines: string[]): string =>
  [
    "<noscript>",
    "  <main>",
    ...bodyLines.map((line) => `    ${line}`),
    "  </main>",
    "</noscript>",
  ]
    .map((line) => `    ${line}`)
    .join("\n");

const buildDeckNoscript = (deck: Deck): string => {
  const lines = [
    `<h1>${escapeHtml(deck.title.en)}</h1>`,
    `<p>${escapeHtml(deckDescription(deck))}</p>`,
    `<p>${escapeHtml(`${formatCardCount(deck.cards.length)} · ${categoryTitle(deck)}`)}</p>`,
  ];
  if (deck.isAdult) {
    lines.push(
      "<p>Turn on JavaScript and confirm you are 18 or older to play.</p>"
    );
  } else {
    lines.push("<h2>Sample cards</h2>", "<ul>");
    for (const card of pickSampleCards(deck)) {
      lines.push(`  <li>${escapeHtml(card.text.en)}</li>`);
    }
    lines.push("</ul>", "<p>Turn on JavaScript to play the whole deck.</p>");
  }
  lines.push(`<p><a href="/decks">See every deck</a></p>`);
  return wrapNoscript(lines);
};

const buildDeckListNoscript = (everyoneDecks: Deck[]): string => {
  const lines = [
    "<h1>All decks</h1>",
    `<p>${escapeHtml(deckListMeta.description)}</p>`,
    "<ul>",
  ];
  for (const deck of everyoneDecks) {
    lines.push(
      `  <li><a href="/decks/${escapeHtml(deck.id)}">${escapeHtml(deck.title.en)}</a>: ${escapeHtml(deck.description.en)}</li>`
    );
  }
  lines.push("</ul>", "<p>Turn on JavaScript to play.</p>");
  return wrapNoscript(lines);
};

const buildFinderNoscript = (): string =>
  wrapNoscript([
    "<h1>Find a deck</h1>",
    `<p>${escapeHtml(finderMeta.description)}</p>`,
    "<p>Turn on JavaScript to use the deck finder.</p>",
    `<p><a href="/decks">See every deck</a></p>`,
  ]);

/** Function replacements keep `$&` and friends in card text literal. */
const buildPage = (
  baseHtml: string,
  meta: PageMeta,
  noscriptBlock: string
): string =>
  baseHtml
    .replace(
      viewportMetaPattern,
      (viewportTag) => `${viewportTag.trimEnd()}\n\n${buildHeadTags(meta)}\n`
    )
    .replace(
      '<div id="root">',
      (rootTag) => `${noscriptBlock.trimStart()}\n    ${rootTag}`
    );

/** Writes <name>.html and <name>/index.html, so cleanUrls and folder paths both work. */
const writePageTwice = (
  parentDirectory: string,
  name: string,
  page: string
): void => {
  mkdirSync(join(parentDirectory, name), { recursive: true });
  writeFileSync(join(parentDirectory, name, "index.html"), page, "utf8");
  writeFileSync(join(parentDirectory, `${name}.html`), page, "utf8");
};

/** Seasonal decks stay in the sitemap all year: their pages always exist. */
const buildSitemap = (indexableDecks: Deck[], lastModified: string): string => {
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}${deckListMeta.path}`,
    `${SITE_URL}${finderMeta.path}`,
    ...indexableDecks.map(deckUrl),
  ];
  const entries = urls.map(
    (url) =>
      `  <url>\n    <loc>${escapeHtml(url)}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
};

const main = (): void => {
  const distDirectory = readDistDirectory();
  const indexPath = join(distDirectory, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(
      `No index.html in ${distDirectory}. Run vite build first, or pass the build folder with --dist.`
    );
  }
  const indexHtml = readFileSync(indexPath, "utf8");
  const baseHtml = stripAppHeadTags(indexHtml);
  const everyoneDecks = decks.filter((deck) => !deck.isAdult);

  const decksDirectory = join(distDirectory, "decks");
  for (const deck of decks) {
    const page = buildPage(
      baseHtml,
      deckPageMeta(deck),
      buildDeckNoscript(deck)
    );
    writePageTwice(decksDirectory, deck.id, page);
  }
  console.log(`Prerendered ${decks.length} deck pages in ${decksDirectory}`);

  writePageTwice(
    distDirectory,
    "decks",
    buildPage(baseHtml, deckListMeta, buildDeckListNoscript(everyoneDecks))
  );
  writePageTwice(
    distDirectory,
    "finder",
    buildPage(baseHtml, finderMeta, buildFinderNoscript())
  );
  console.log(`Prerendered the deck list and finder pages in ${distDirectory}`);

  const lastModified = new Date().toISOString().slice(0, 10);
  writeFileSync(
    join(distDirectory, "sitemap.xml"),
    buildSitemap(everyoneDecks, lastModified),
    "utf8"
  );
  console.log(
    `Wrote sitemap.xml with ${everyoneDecks.length + 3} URLs in ${distDirectory}`
  );

  writeFileSync(join(distDirectory, "404.html"), indexHtml, "utf8");
  console.log(`Wrote 404.html in ${distDirectory}`);
};

try {
  main();
} catch (error: unknown) {
  console.error(
    "Could not prerender the deck pages:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
}
