import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_FILE_CHARACTERS,
  applyBackup,
  buildBackupFileName,
  createBackup,
  mergeBackupData,
  readBackup,
  type BackupData,
  type BackupFile,
} from "./backup";
import {
  MAX_CUSTOM_DECKS,
  customDecksStore,
  type CustomDeck,
} from "./customDecks";
import { favouritesStore } from "./favourites";
import { emptyStats, statsStore, type PlayStats } from "./stats";
import { settingsStore } from "./settings";

const makeDeck = (id: string, updatedAt = 1000, title = id): CustomDeck => ({
  id: `custom-${id}`,
  title,
  cards: [{ id: `${id}-1`, type: "question", text: `Question for ${id}` }],
  createdAt: 500,
  updatedAt,
});

const makeDecks = (count: number, prefix = "deck"): CustomDeck[] =>
  Array.from({ length: count }, (_, index) => makeDeck(`${prefix}${index}`));

const makeData = (overrides: Partial<BackupData> = {}): BackupData => ({
  customDecks: [],
  favourites: [],
  stats: emptyStats,
  ...overrides,
});

const makeFile = (overrides: Partial<BackupFile> = {}): BackupFile => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt: "2026-11-23T10:00:00.000Z",
  ...makeData(),
  ...overrides,
});

const stats = (overrides: Partial<PlayStats> = {}): PlayStats => ({
  ...emptyStats,
  ...overrides,
});

describe("createBackup", () => {
  beforeEach(() => localStorage.clear());

  it("exports format, version, date, custom decks, favourites and stats, and no settings", () => {
    const deck = makeDeck("a");
    customDecksStore.set([deck]);
    favouritesStore.set(["unravel-001", "first-date-004"]);
    statsStore.set(stats({ cardsSeen: 7, decksStarted: { unravel: 2 } }));
    settingsStore.set({ ...settingsStore.get(), theme: "light" });

    const backup = createBackup(new Date("2026-11-23T10:00:00.000Z"));

    expect(backup).toEqual({
      format: "unravel-backup",
      version: 1,
      exportedAt: "2026-11-23T10:00:00.000Z",
      customDecks: [deck],
      favourites: ["unravel-001", "first-date-004"],
      stats: stats({ cardsSeen: 7, decksStarted: { unravel: 2 } }),
    });
    expect(Object.keys(backup)).not.toContain("settings");
  });
});

describe("buildBackupFileName", () => {
  it("names the file unravel-backup-2026-11-23.json", () => {
    expect(buildBackupFileName(new Date(2026, 10, 23))).toBe(
      "unravel-backup-2026-11-23.json"
    );
  });

  it("pads single-digit months and days", () => {
    expect(buildBackupFileName(new Date(2027, 0, 5))).toBe(
      "unravel-backup-2027-01-05.json"
    );
  });
});

describe("readBackup", () => {
  it("reads a backup it exported and counts decks and favourites", () => {
    const backup = makeFile({
      customDecks: makeDecks(3),
      favourites: ["a-001", "a-002"],
    });
    const result = readBackup(JSON.stringify(backup));
    expect(result).toEqual({
      isValid: true,
      backup,
      deckCount: 3,
      favouriteCount: 2,
    });
  });

  it.each([
    ["", "not-json"],
    ["not json at all", "not-json"],
    ["\u0089PNG\r\n\u001a\n\u0000\u0000", "not-json"],
    ["{}", "not-backup"],
    ["[]", "not-backup"],
    ["null", "not-backup"],
    ['{"format":"something-else","version":1}', "not-backup"],
    ['{"format":"unravel-backup","version":1}', "not-backup"],
    [
      '{"format":"unravel-backup","version":"1","customDecks":[],"favourites":[],"stats":{}}',
      "not-backup",
    ],
    [
      '{"format":"unravel-backup","version":1,"customDecks":{},"favourites":[],"stats":{}}',
      "not-backup",
    ],
    [
      '{"format":"unravel-backup","version":1,"customDecks":[],"favourites":[1],"stats":{}}',
      "not-backup",
    ],
    [
      '{"format":"unravel-backup","version":1,"customDecks":[],"favourites":[],"stats":[]}',
      "not-backup",
    ],
    [
      '{"format":"unravel-backup","version":2,"customDecks":[],"favourites":[],"stats":{}}',
      "newer-version",
    ],
    ['{"format":"unravel-backup","version":2}', "newer-version"],
  ])("refuses %j as %s", (text, problem) => {
    expect(readBackup(text)).toEqual({ isValid: false, problem });
  });

  it("refuses text past 5,000,000 characters before parsing it", () => {
    const parseSpy = vi.spyOn(JSON, "parse");
    const result = readBackup("x".repeat(MAX_BACKUP_FILE_CHARACTERS + 1));
    expect(result).toEqual({ isValid: false, problem: "too-large" });
    expect(parseSpy).not.toHaveBeenCalled();
    parseSpy.mockRestore();
  });

  it("drops invalid decks inside an otherwise valid backup and keeps the rest", () => {
    const good = makeDeck("good");
    const text = JSON.stringify({
      ...makeFile(),
      customDecks: [
        good,
        { id: "not-custom", title: "x", cards: [], createdAt: 1, updatedAt: 1 },
        {
          id: "custom-broken",
          title: 4,
          cards: [],
          createdAt: 1,
          updatedAt: 1,
        },
        "nonsense",
      ],
    });
    const result = readBackup(text);
    expect(result).toMatchObject({ isValid: true, deckCount: 1 });
    if (result.isValid) expect(result.backup.customDecks).toEqual([good]);
  });

  it("counts a deck repeated in the file once, keeping the newer copy", () => {
    const result = readBackup(
      JSON.stringify(
        makeFile({
          customDecks: [
            makeDeck("a", 100, "Old"),
            makeDeck("a", 300, "New"),
            makeDeck("a", 200, "Middle"),
          ],
          favourites: ["x-001", "x-001"],
        })
      )
    );
    expect(result).toMatchObject({
      isValid: true,
      deckCount: 1,
      favouriteCount: 1,
    });
    if (result.isValid) {
      expect(result.backup.customDecks[0]?.title).toBe("New");
      expect(result.backup.favourites).toEqual(["x-001"]);
    }
  });
});

describe("mergeBackupData", () => {
  it("keeps the deck with the newer updatedAt for a shared id", () => {
    const current = makeData({
      customDecks: [
        makeDeck("a", 100, "Local old"),
        makeDeck("b", 900, "Local new"),
      ],
    });
    const incoming = makeData({
      customDecks: [
        makeDeck("a", 200, "File new"),
        makeDeck("b", 300, "File old"),
      ],
    });
    const { merged, report } = mergeBackupData(current, incoming);
    expect(merged.customDecks.map((deck) => deck.title)).toEqual([
      "File new",
      "Local new",
    ]);
    expect(report).toEqual({
      decksAdded: 0,
      decksUpdated: 1,
      decksSkipped: 0,
      favouritesAdded: 0,
    });
  });

  it("adds new decks up to 50 and counts the rest as skipped", () => {
    const current = makeData({ customDecks: makeDecks(48) });
    const incoming = makeData({ customDecks: makeDecks(5, "new") });
    const { merged, report } = mergeBackupData(current, incoming);
    expect(merged.customDecks).toHaveLength(MAX_CUSTOM_DECKS);
    expect(merged.customDecks.slice(48).map((deck) => deck.id)).toEqual([
      "custom-new0",
      "custom-new1",
    ]);
    expect(report).toMatchObject({ decksAdded: 2, decksSkipped: 3 });
  });

  it("updates a shared deck even when the device is at the 50 deck limit", () => {
    const current = makeData({ customDecks: makeDecks(50) });
    const incoming = makeData({
      customDecks: [makeDeck("deck3", 2000, "Edited elsewhere")],
    });
    const { merged, report } = mergeBackupData(current, incoming);
    expect(merged.customDecks).toHaveLength(50);
    expect(merged.customDecks[3]?.title).toBe("Edited elsewhere");
    expect(report).toMatchObject({ decksUpdated: 1, decksSkipped: 0 });
  });

  it("unions favourites and keeps the existing order first", () => {
    const { merged, report } = mergeBackupData(
      makeData({ favourites: ["c-001", "a-001"] }),
      makeData({ favourites: ["b-001", "a-001", "d-001"] })
    );
    expect(merged.favourites).toEqual(["c-001", "a-001", "b-001", "d-001"]);
    expect(report.favouritesAdded).toBe(2);
  });

  it("takes the higher value of every stats counter", () => {
    const { merged } = mergeBackupData(
      makeData({
        stats: stats({
          decksStarted: { a: 5, b: 1 },
          decksFinished: { a: 1 },
          cardsSeen: 100,
          millisecondsPlayed: 10,
        }),
      }),
      makeData({
        stats: stats({
          decksStarted: { a: 2, c: 4 },
          decksFinished: { a: 3, c: 1 },
          cardsSeen: 40,
          millisecondsPlayed: 900,
        }),
      })
    );
    expect(merged.stats).toEqual({
      decksStarted: { a: 5, b: 1, c: 4 },
      decksFinished: { a: 3, c: 1 },
      cardsSeen: 100,
      millisecondsPlayed: 900,
    });
  });

  it("merges counters for deck ids that share a name with object built-ins", () => {
    const { merged } = mergeBackupData(
      makeData({ stats: stats({ decksStarted: { toString: 2 } }) }),
      makeData({
        stats: stats({ decksStarted: { constructor: 3, toString: 1 } }),
      })
    );
    expect(merged.stats.decksStarted).toEqual({ constructor: 3, toString: 2 });
  });

  it("never deletes anything the device already has", () => {
    const current = makeData({
      customDecks: [makeDeck("keep")],
      favourites: ["keep-001"],
      stats: stats({ cardsSeen: 9 }),
    });
    const { merged } = mergeBackupData(current, makeData());
    expect(merged).toEqual(current);
  });

  it("changes nothing when the same backup is merged twice", () => {
    const current = makeData({
      customDecks: [makeDeck("mine")],
      favourites: ["mine-001"],
      stats: stats({ cardsSeen: 3, decksStarted: { mine: 1 } }),
    });
    const incoming = makeData({
      customDecks: [makeDeck("mine", 5000, "Newer"), makeDeck("theirs")],
      favourites: ["theirs-001", "mine-001"],
      stats: stats({
        cardsSeen: 8,
        millisecondsPlayed: 60_000,
        decksFinished: { theirs: 2 },
      }),
    });
    const first = mergeBackupData(current, incoming);
    const second = mergeBackupData(first.merged, incoming);
    expect(second.merged).toEqual(first.merged);
    expect(second.report).toEqual({
      decksAdded: 0,
      decksUpdated: 0,
      decksSkipped: 0,
      favouritesAdded: 0,
    });
  });
});

describe("applyBackup", () => {
  beforeEach(() => localStorage.clear());

  it("merges into the three stores and reports what happened", () => {
    customDecksStore.set([makeDeck("mine")]);
    favouritesStore.set(["mine-001"]);
    const backup = makeFile({
      customDecks: [makeDeck("theirs")],
      favourites: ["theirs-001"],
      stats: stats({ cardsSeen: 12 }),
    });

    const result = applyBackup(backup);

    expect(result.isSaved).toBe(true);
    expect(result.report).toEqual({
      decksAdded: 1,
      decksUpdated: 0,
      decksSkipped: 0,
      favouritesAdded: 1,
    });
    expect(customDecksStore.get().map((deck) => deck.id)).toEqual([
      "custom-mine",
      "custom-theirs",
    ]);
    expect(favouritesStore.get()).toEqual(["mine-001", "theirs-001"]);
    expect(statsStore.get().cardsSeen).toBe(12);
  });

  it("changes nothing in storage when the same backup is applied twice", () => {
    const backup = makeFile({
      customDecks: makeDecks(3),
      favourites: ["a-001", "b-002"],
      stats: stats({ cardsSeen: 5, decksStarted: { a: 1 } }),
    });
    expect(applyBackup(backup).isSaved).toBe(true);
    const snapshot = { ...localStorage };
    const second = applyBackup(backup);
    expect(second).toEqual({
      isSaved: true,
      report: {
        decksAdded: 0,
        decksUpdated: 0,
        decksSkipped: 0,
        favouritesAdded: 0,
      },
    });
    expect({ ...localStorage }).toEqual(snapshot);
    expect(customDecksStore.get()).toHaveLength(3);
    expect(statsStore.get().cardsSeen).toBe(5);
  });

  it("reports isSaved false and leaves the old data when storage refuses the write", () => {
    customDecksStore.set([makeDeck("mine")]);
    favouritesStore.set(["mine-001"]);
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

    const result = applyBackup(
      makeFile({
        customDecks: [makeDeck("theirs")],
        favourites: ["theirs-001"],
        stats: stats({ cardsSeen: 4 }),
      })
    );

    expect(result.isSaved).toBe(false);
    expect(customDecksStore.get().map((deck) => deck.id)).toEqual([
      "custom-mine",
    ]);
    expect(favouritesStore.get()).toEqual(["mine-001"]);
    expect(statsStore.get().cardsSeen).toBe(0);
    setItem.mockRestore();
  });
});
