/** Shared CSV helpers for packs-to-csv.ts and csv-to-packs.ts (RFC 4180 quoting). */

export const CSV_COLUMNS = [
  "id",
  "type",
  "level",
  "timerSeconds",
  "en",
  "pt",
] as const;

const quoteField = (value: string): string =>
  /[",\n\r]/.test(value) || value !== value.trim()
    ? `"${value.replaceAll('"', '""')}"`
    : value;

export const toCsvLine = (fields: string[]): string =>
  fields.map(quoteField).join(",");

export interface CsvRow {
  /** 1-based line number where the row starts, for error messages. */
  lineNumber: number;
  fields: string[];
}

/** Parses CSV text into rows. Throws with the line number when a quoted field never closes. */
export const parseCsv = (source: string): CsvRow[] => {
  const text = source.replace(/^\uFEFF/, "");
  const rows: CsvRow[] = [];
  let fields: string[] = [];
  let field = "";
  let isQuoted = false;
  let lineNumber = 1;
  let rowStartLine = 1;

  for (
    let characterIndex = 0;
    characterIndex < text.length;
    characterIndex += 1
  ) {
    const character = text[characterIndex];
    if (isQuoted) {
      if (character === '"') {
        if (text[characterIndex + 1] === '"') {
          field += '"';
          characterIndex += 1;
        } else {
          isQuoted = false;
        }
      } else {
        if (character === "\n") {
          lineNumber += 1;
        }
        field += character;
      }
      continue;
    }
    if (character === '"' && field === "") {
      isQuoted = true;
    } else if (character === ",") {
      fields.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[characterIndex + 1] === "\n") {
        characterIndex += 1;
      }
      fields.push(field);
      rows.push({ lineNumber: rowStartLine, fields });
      fields = [];
      field = "";
      lineNumber += 1;
      rowStartLine = lineNumber;
    } else {
      field += character;
    }
  }

  if (isQuoted) {
    throw new Error(`line ${rowStartLine}: a quoted field is never closed.`);
  }
  if (field !== "" || fields.length > 0) {
    fields.push(field);
    rows.push({ lineNumber: rowStartLine, fields });
  }
  return rows.filter(
    (row) => !(row.fields.length === 1 && row.fields[0] === "")
  );
};
