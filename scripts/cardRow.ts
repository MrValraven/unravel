/** Turns one CSV row into a card, for csv-to-packs.ts. Columns: id,type,level,timerSeconds,en,pt */
import {
  MAX_TIMER_SECONDS,
  MIN_TIMER_SECONDS,
  allowsTimer,
  cardTypes,
  isCardType,
} from "../src/content/cardRules";
import type { Card, IntensityLevel } from "../src/content/types";
import { CSV_COLUMNS } from "./csv";

const emDash = "—";

const parseLevel = (value: string): IntensityLevel | undefined =>
  value === "1" ? 1 : value === "2" ? 2 : value === "3" ? 3 : undefined;

/**
 * Checks every rule a single row can break and returns each problem as
 * `line <n> (<card id>): <reason>`. The card comes back only when there is none.
 * Rules across rows (repeated ids or texts) stay with the caller.
 */
export const parseCardRow = (
  fields: string[],
  deckId: string,
  lineNumber: number
): { card?: Card; problems: string[] } => {
  const problems: string[] = [];
  const report = (cardId: string, reason: string) =>
    problems.push(
      `line ${lineNumber}${cardId ? ` (${cardId})` : ""}: ${reason}`
    );

  if (fields.length !== CSV_COLUMNS.length) {
    report(
      fields[0]?.trim() ?? "",
      `expected ${CSV_COLUMNS.length} columns, found ${fields.length}`
    );
    return { problems };
  }
  const [
    id = "",
    typeValue = "",
    levelValue = "",
    timerValue = "",
    english = "",
    portuguese = "",
  ] = fields.map((field) => field.trim());

  if (!new RegExp(`^${deckId}-\\d{3}$`).test(id)) {
    report(id, `id must look like ${deckId}-001`);
  }

  const type = isCardType(typeValue) ? typeValue : undefined;
  if (type === undefined) {
    report(id, `type "${typeValue}" must be one of ${cardTypes.join(", ")}`);
  }
  const level = parseLevel(levelValue);
  if (level === undefined) {
    report(id, `level "${levelValue}" must be 1, 2 or 3`);
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
        id,
        `timerSeconds "${timerValue}" must be a whole number from ${MIN_TIMER_SECONDS} to ${MAX_TIMER_SECONDS}`
      );
    } else if (type !== undefined && !allowsTimer(type)) {
      report(
        id,
        "timerSeconds is only allowed on challenge and hot-seat cards"
      );
    }
  }

  if (english === "") {
    report(id, "the en text is empty");
  }
  if (english.includes(emDash) || portuguese.includes(emDash)) {
    report(
      id,
      "card text contains an em dash; use a comma, colon or full stop"
    );
  }

  if (problems.length > 0 || type === undefined || level === undefined) {
    return { problems };
  }
  const card: Card = { id, type, level, text: { en: english, pt: portuguese } };
  if (timerSeconds !== undefined) {
    card.timerSeconds = timerSeconds;
  }
  return { card, problems };
};
