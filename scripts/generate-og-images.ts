/**
 * Renders the link preview images (1200x630 PNG) into public/og.
 *
 *   npm run og:images
 *
 *   public/og/unravel.png            the app itself (home, /decks, /finder)
 *   public/og/decks/<deck-id>.png    one per live deck for everyone
 *   public/og/adults.png             shared by every 18+ deck, with no explicit text
 *
 * Deck images sit in their own folder because the "unravel" deck shares its id
 * with the app image.
 *
 * Uses the Playwright Chromium installed on this machine. Run it again after
 * adding a deck or changing a deck's title, description or accent, and commit
 * the PNGs. scripts/prerender-decks.ts points each deck page at its image.
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { categoryAccents, decks } from "../src/content/decks";
import type { Card, CardType, Deck, DeckCategory } from "../src/content/types";

const repoRoot = resolve(import.meta.dirname, "..");
const templateUrl = pathToFileURL(
  join(repoRoot, "scripts/og-template.html")
).href;
const outputDirectory = join(repoRoot, "public/og");

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const MAX_SAMPLE_LENGTH = 100;

// The app accent; the same pink as the dating tone.
const brandAccent = categoryAccents.dating;
const categoryLabels: Record<DeckCategory, string> = {
  friends: "For friends",
  dating: "For dates and partners",
  adults: "18+ only",
};
const cardTypeLabels: Record<CardType, string> = {
  question: "Question",
  challenge: "Challenge",
  everyone: "Everyone",
  vote: "Vote",
  "hot-seat": "Hot seat",
};

/** Matches window.renderOgImage in scripts/og-template.html. */
interface OgImageData {
  eyebrow: string;
  title: string;
  /** Draws the title as the Unravel wordmark (the word with its loose thread). */
  isTitleWordmark: boolean;
  description: string;
  facts: string[];
  accent: string;
  secondAccent: string;
  thirdAccent: string;
  cardLabel: string;
  cardText: string;
  cardBadge: string;
}

interface OgImageJob {
  fileName: string;
  data: OgImageData;
}

declare global {
  interface Window {
    renderOgImage: (data: OgImageData) => Promise<void>;
  }
}

const formatCardCount = (count: number): string =>
  count === 1 ? "1 card" : `${count} cards`;

/** The first gentle question short enough to read on a small preview. */
const pickSampleCard = (deck: Deck): Card | undefined => {
  const openingCards = deck.cards.filter((card) => card.level === 1);
  const candidates = openingCards.length > 0 ? openingCards : deck.cards;
  const shortQuestion = candidates.find(
    (card) =>
      card.type === "question" && card.text.en.length <= MAX_SAMPLE_LENGTH
  );
  if (shortQuestion) return shortQuestion;
  return [...candidates].sort(
    (first, second) => first.text.en.length - second.text.en.length
  )[0];
};

const buildDeckJob = (deck: Deck): OgImageJob => {
  const sampleCard = pickSampleCard(deck);
  return {
    fileName: `decks/${deck.id}.png`,
    data: {
      eyebrow: "Unravel",
      title: deck.title.en,
      isTitleWordmark: false,
      description: deck.description.en,
      facts: [
        formatCardCount(deck.cards.length),
        categoryLabels[deck.category],
      ],
      accent: deck.accent,
      secondAccent: categoryAccents[deck.category],
      thirdAccent: brandAccent,
      cardLabel: sampleCard ? cardTypeLabels[sampleCard.type] : "",
      cardText: sampleCard ? sampleCard.text.en : "",
      cardBadge: "",
    },
  };
};

const buildAppJob = (everyoneDecks: Deck[]): OgImageJob => {
  const homeDeck = everyoneDecks.find((deck) => deck.id === "unravel");
  const sampleCard = homeDeck ? pickSampleCard(homeDeck) : undefined;
  return {
    fileName: "unravel.png",
    data: {
      eyebrow: "A game about people",
      title: "Unravel",
      isTitleWordmark: true,
      description:
        "Good questions for friends, dates and partners. Pick a deck, pass the phone and get talking.",
      facts: [`${everyoneDecks.length} decks`, "English and Portuguese"],
      accent: brandAccent,
      secondAccent: categoryAccents.friends,
      thirdAccent: categoryAccents.dating,
      cardLabel: sampleCard ? cardTypeLabels[sampleCard.type] : "",
      cardText: sampleCard ? sampleCard.text.en : "",
      cardBadge: "",
    },
  };
};

const buildAdultsJob = (adultDecks: Deck[]): OgImageJob => ({
  fileName: "adults.png",
  data: {
    eyebrow: "Unravel",
    title: "For grown-ups",
    isTitleWordmark: false,
    description:
      "Decks about intimacy, trust and care for consenting adults. You confirm you are 18 or older before you play.",
    facts: [`${adultDecks.length} decks`, categoryLabels.adults],
    accent: categoryAccents.adults,
    secondAccent: categoryAccents.adults,
    thirdAccent: brandAccent,
    cardLabel: "Adults only",
    cardText: "",
    cardBadge: "18+",
  },
});

const main = async (): Promise<void> => {
  const everyoneDecks = decks.filter((deck) => !deck.isAdult);
  const adultDecks = decks.filter((deck) => deck.isAdult);
  const jobs: OgImageJob[] = [
    buildAppJob(everyoneDecks),
    ...everyoneDecks.map(buildDeckJob),
  ];
  if (adultDecks.length > 0) jobs.push(buildAdultsJob(adultDecks));

  mkdirSync(join(outputDirectory, "decks"), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.goto(templateUrl);
    for (const job of jobs) {
      await page.evaluate((data) => window.renderOgImage(data), job.data);
      const outputPath = join(outputDirectory, job.fileName);
      await page.screenshot({ path: outputPath, type: "png" });
      console.log(`Wrote ${outputPath}`);
    }
  } finally {
    await browser.close();
  }
};

main().catch((error: unknown) => {
  console.error("Could not render the share images:", error);
  process.exitCode = 1;
});
