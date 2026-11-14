/**
 * Converts edited CSV files back into deck packs.
 *
 *   npx tsx scripts/csv-to-packs.ts
 *     Reads every content-export/<deck-id>.csv.
 *   npx tsx scripts/csv-to-packs.ts content-export/first-date.csv
 *     Reads only the files given.
 *
 * Every file is validated first. When any row has a problem, the script prints each
 * problem with its file, line, card id and reason, and writes nothing.
 * Columns: id,type,level,timerSeconds,en,pt
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import type {
  Card,
  CardType,
  DeckPackFile,
  IntensityLevel,
} from "../src/content/types";
import { CSV_COLUMNS, parseCsv, type CsvRow } from "./csv";

const repoRoot = resolve(import.meta.dirname, "..");
const packsDirectory = join(repoRoot, "src/content/packs");
const exportDirectory = join(repoRoot, "content-export");

const cardTypes: readonly CardType[] = ["question", "challenge", "everyone"];
const MIN_TIMER_SECONDS = 30;
const MAX_TIMER_SECONDS = 120;
const emDash = "\u2014";

interface ConvertedPack {
  pack: DeckPackFile;
  outputPath: string;
  /** The CSV (or untouched pack JSON) the cards came from, for error messages. */
  sourcePath: string;
  /** CSV line of each card id; empty for packs read from JSON. */
  lineNumbers: Map<string, number>;
}

const isCardType = (value: string): value is CardType =>
  (cardTypes as readonly string[]).includes(value);

const parseLevel = (value: string): IntensityLevel | undefined =>
  value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : undefined;

const convertFile = (
  csvPath: string,
  problems: string[]
): ConvertedPack | undefined => {
  const deckId = basename(csvPath, ".csv");
  const report = (lineNumber: number, cardId: string, reason: string) =>
    problems.push(
      `${csvPath} line ${lineNumber}${cardId ? ` (${cardId})` : ""}: ${reason}`
    );

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(deckId)) {
    report(
      1,
      "",
      `file name "${deckId}" must be a kebab-case deck id, for example first-date.csv`
    );
    return undefined;
  }

  let rows: CsvRow[];
  try {
    rows = parseCsv(readFileSync(csvPath, "utf8"));
  } catch (error) {
    problems.push(
      `${csvPath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return undefined;
  }

  const [header, ...cardRows] = rows;
  if (!header || header.fields.join(",") !== CSV_COLUMNS.join(",")) {
    report(1, "", `header must be exactly "${CSV_COLUMNS.join(",")}"`);
    return undefined;
  }
  if (cardRows.length === 0) {
    report(2, "", "the deck has no cards");
  }

  const idPattern = new RegExp(`^${deckId}-\\d{3}$`);
  const seenIds = new Set<string>();
  const cards: Card[] = [];
  const lineNumbers = new Map<string, number>();

  for (const { lineNumber, fields } of cardRows) {
    if (fields.length !== CSV_COLUMNS.length) {
      report(
        lineNumber,
        fields[0] ?? "",
        `expected ${CSV_COLUMNS.length} columns, found ${fields.length}`
      );
      continue;
    }
    const [
      id = "",
      typeValue = "",
      levelValue = "",
      timerValue = "",
      english = "",
      portuguese = "",
    ] = fields.map((field) => field.trim());
    const rowProblemCount = problems.length;

    if (!idPattern.test(id)) {
      report(lineNumber, id, `id must look like ${deckId}-001`);
    } else if (seenIds.has(id)) {
      report(lineNumber, id, "id is used by an earlier row");
    }
    seenIds.add(id);

    if (!isCardType(typeValue)) {
      report(
        lineNumber,
        id,
        `type "${typeValue}" must be one of ${cardTypes.join(", ")}`
      );
    }
    const level = parseLevel(levelValue);
    if (level === undefined) {
      report(lineNumber, id, `level "${levelValue}" must be 1, 2 or 3`);
    }

    let timerSeconds: number | undefined;
    if (timerValue !== "") {
      timerSeconds = Number(timerValue);
      if (
        !Number.isInteger(timerSeconds) ||
        timerSeconds < MIN_TIMER_SECONDS ||
        timerSeconds > MAX_TIMER_SECONDS
      ) {
        report(
          lineNumber,
          id,
          `timerSeconds "${timerValue}" must be a whole number from ${MIN_TIMER_SECONDS} to ${MAX_TIMER_SECONDS}`
        );
      } else if (typeValue !== "challenge") {
        report(
          lineNumber,
          id,
          "timerSeconds is only allowed on challenge cards"
        );
      }
    }

    if (english === "") {
      report(lineNumber, id, "the en text is empty");
    }
    if (english.includes(emDash) || portuguese.includes(emDash)) {
      report(
        lineNumber,
        id,
        "card text contains an em dash; use a comma, colon or full stop"
      );
    }

    if (
      problems.length === rowProblemCount &&
      isCardType(typeValue) &&
      level !== undefined
    ) {
      const card: Card = {
        id,
        type: typeValue,
        level,
        text: { en: english, pt: portuguese },
      };
      if (timerSeconds !== undefined) {
        card.timerSeconds = timerSeconds;
      }
      cards.push(card);
      lineNumbers.set(id, lineNumber);
    }
  }

  return {
    pack: { id: deckId, cards },
    outputPath: join(packsDirectory, `${deckId}.json`),
    sourcePath: csvPath,
    lineNumbers,
  };
};

const findDuplicateTexts = (
  converted: ConvertedPack[],
  problems: string[]
): void => {
  for (const locale of ["en", "pt"] as const) {
    const firstSeen = new Map<string, string>();
    for (const { pack, sourcePath, lineNumbers } of converted) {
      for (const card of pack.cards) {
        const normalized = card.text[locale].trim().toLowerCase();
        if (normalized === "") {
          continue;
        }
        const lineNumber = lineNumbers.get(card.id);
        const location =
          lineNumber === undefined
            ? `${sourcePath} (${card.id})`
            : `${sourcePath} line ${lineNumber} (${card.id})`;
        const earlierLocation = firstSeen.get(normalized);
        if (earlierLocation) {
          problems.push(
            `${location}: ${locale} text repeats ${earlierLocation}`
          );
        } else {
          firstSeen.set(normalized, location);
        }
      }
    }
  }
};

const main = (): void => {
  const requestedPaths = process.argv.slice(2).map((path) => resolve(path));
  const csvPaths =
    requestedPaths.length > 0
      ? requestedPaths
      : existsSync(exportDirectory)
        ? readdirSync(exportDirectory)
            .filter((fileName) => fileName.endsWith(".csv"))
            .map((fileName) => join(exportDirectory, fileName))
        : [];
  if (csvPaths.length === 0) {
    throw new Error(
      "No CSV files found. Run `npx tsx scripts/packs-to-csv.ts` first or pass CSV paths."
    );
  }

  const problems: string[] = [];
  const converted = csvPaths
    .map((csvPath) => convertFile(csvPath, problems))
    .filter((entry): entry is ConvertedPack => entry !== undefined);
  // Compare against the packs left untouched too, so a CSV cannot reuse another deck's text.
  const convertedIds = new Set(converted.map(({ pack }) => pack.id));
  const untouchedPacks: ConvertedPack[] = readdirSync(packsDirectory)
    .filter(
      (fileName) =>
        fileName.endsWith(".json") &&
        !convertedIds.has(basename(fileName, ".json"))
    )
    .map((fileName) => ({
      pack: JSON.parse(
        readFileSync(join(packsDirectory, fileName), "utf8")
      ) as DeckPackFile,
      outputPath: join(packsDirectory, fileName),
      sourcePath: join(packsDirectory, fileName),
      lineNumbers: new Map<string, number>(),
    }));
  // Untouched packs go first so a duplicate is reported on the CSV row that introduced it.
  findDuplicateTexts([...untouchedPacks, ...converted], problems);

  if (problems.length > 0) {
    console.error(
      `Nothing was written. Fix ${problems.length === 1 ? "this problem" : `these ${problems.length} problems`} first:`
    );
    for (const problem of problems) {
      console.error(`  ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  for (const { pack, outputPath } of converted) {
    const isNewDeck = !existsSync(outputPath);
    writeFileSync(outputPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
    console.log(`Wrote ${pack.cards.length} cards to ${outputPath}`);
    if (isNewDeck) {
      console.log(
        `  ${pack.id} is a new deck: register it in src/content/decks.ts before it shows in the app.`
      );
    }
  }
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
