/**
 * Exports deck packs to CSV for editing and translation.
 *
 *   npx tsx scripts/packs-to-csv.ts
 *     Writes content-export/<deck-id>.csv for every pack in src/content/packs.
 *
 *   npx tsx scripts/packs-to-csv.ts --draft content-drafts/networking.json --id networking
 *     Converts a v1 draft (a plain list of English texts) into content-export/networking.csv,
 *     with every card as a level 1 question, ready to edit and bring in with csv-to-packs.
 *
 * Columns: id,type,level,timerSeconds,en,pt
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type { Card, DeckPackFile } from "../src/content/types";
import { CSV_COLUMNS, toCsvLine } from "./csv";

const repoRoot = resolve(import.meta.dirname, "..");
const packsDirectory = join(repoRoot, "src/content/packs");
const exportDirectory = join(repoRoot, "content-export");

const cardToRow = (card: Card): string[] => [
  card.id,
  card.type,
  String(card.level),
  card.timerSeconds === undefined ? "" : String(card.timerSeconds),
  card.text.en,
  card.text.pt,
];

const writeCsv = (deckId: string, cards: Card[]): void => {
  const lines = [
    toCsvLine([...CSV_COLUMNS]),
    ...cards.map((card) => toCsvLine(cardToRow(card))),
  ];
  const outputPath = join(exportDirectory, `${deckId}.csv`);
  writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${cards.length} cards to ${outputPath}`);
};

const readFlag = (argumentList: string[], flag: string): string | undefined => {
  const flagIndex = argumentList.indexOf(flag);
  return flagIndex === -1 ? undefined : argumentList[flagIndex + 1];
};

const exportDraft = (draftPath: string, deckId: string): void => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(deckId)) {
    throw new Error(
      `Deck id "${deckId}" must be kebab-case, for example "monthly-checkup".`
    );
  }
  const draft: unknown = JSON.parse(readFileSync(resolve(draftPath), "utf8"));
  if (
    !Array.isArray(draft) ||
    !draft.every((entry) => typeof entry === "string")
  ) {
    throw new Error(
      `${draftPath} is not a v1 draft: expected a JSON list of card texts.`
    );
  }
  const cards: Card[] = draft.map((text: string, cardIndex) => ({
    id: `${deckId}-${String(cardIndex + 1).padStart(3, "0")}`,
    type: "question",
    level: 1,
    text: { en: text.trim(), pt: "" },
  }));
  writeCsv(deckId, cards);
};

const exportPacks = (): void => {
  const packFiles = readdirSync(packsDirectory).filter((fileName) =>
    fileName.endsWith(".json")
  );
  for (const fileName of packFiles) {
    const pack = JSON.parse(
      readFileSync(join(packsDirectory, fileName), "utf8")
    ) as DeckPackFile;
    const fileId = basename(fileName, ".json");
    if (pack.id !== fileId) {
      throw new Error(
        `${fileName} has id "${pack.id}"; the id must match the file name "${fileId}".`
      );
    }
    writeCsv(pack.id, pack.cards);
  }
};

const main = (): void => {
  const argumentList = process.argv.slice(2);
  mkdirSync(exportDirectory, { recursive: true });
  const draftPath = readFlag(argumentList, "--draft");
  if (draftPath) {
    const deckId = readFlag(argumentList, "--id");
    if (!deckId) {
      throw new Error(
        "--draft needs --id <deck-id> to name the exported deck."
      );
    }
    exportDraft(draftPath, deckId);
    return;
  }
  exportPacks();
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
