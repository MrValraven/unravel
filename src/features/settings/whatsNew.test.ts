import { describe, expect, it } from "vitest";
import {
  compareVersions,
  getReleasesSince,
  releases,
  type Release,
} from "./whatsNew";

const sampleReleases: Release[] = [
  {
    version: "2.1.0",
    date: "2027-01-10",
    items: [{ en: "Later", pt: "Depois" }],
  },
  {
    version: "2.0.0",
    date: "2026-11-14",
    items: [{ en: "Big", pt: "Grande" }],
  },
  {
    version: "1.5.0",
    date: "2026-01-01",
    items: [{ en: "Old", pt: "Antigo" }],
  },
];

describe("compareVersions", () => {
  it("orders versions part by part", () => {
    expect(compareVersions("2.0.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.10.0", "1.9.0")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("1.0", "1.0.1")).toBeLessThan(0);
  });
});

describe("getReleasesSince", () => {
  it("lists the releases between the last seen and the current version, newest first", () => {
    const versions = getReleasesSince("1.5.0", "2.1.0", sampleReleases).map(
      (release) => release.version
    );
    expect(versions).toEqual(["2.1.0", "2.0.0"]);
  });

  it("leaves out releases newer than the running version", () => {
    const versions = getReleasesSince("1.0.0", "2.0.0", sampleReleases).map(
      (release) => release.version
    );
    expect(versions).toEqual(["2.0.0", "1.5.0"]);
  });

  it("returns nothing when the player is up to date", () => {
    expect(getReleasesSince("2.1.0", "2.1.0", sampleReleases)).toEqual([]);
  });
});

describe("releases", () => {
  it("runs newest first and every note has English and Portuguese text", () => {
    for (
      let releaseIndex = 1;
      releaseIndex < releases.length;
      releaseIndex += 1
    ) {
      const newer = releases[releaseIndex - 1];
      const older = releases[releaseIndex];
      if (!newer || !older) throw new Error("release list has a gap");
      expect(compareVersions(newer.version, older.version)).toBeGreaterThan(0);
    }
    for (const release of releases) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.items.length).toBeGreaterThan(0);
      for (const item of release.items) {
        expect(item.en.trim()).not.toBe("");
        expect(item.pt.trim()).not.toBe("");
      }
    }
  });
});

describe("release notes 2.1.0", () => {
  it("lists 2.1.0 first", () => expect(releases[0]?.version).toBe("2.1.0"));

  it("calls the dim theme Penumbra in Portuguese, as Settings does", () => {
    const text = releases.flatMap((r) => r.items.map((i) => i.pt)).join(" ");
    expect(text).not.toMatch(/modo noturno/i);
    expect(text).toMatch(/Penumbra/);
  });

  it("keeps em dashes and Brazilian forms out of the notes", () => {
    const items = releases.flatMap((r) => r.items);
    for (const item of items) {
      expect(`${item.en} ${item.pt}`).not.toMatch(/—|--|\bvocê(?!s)/i);
    }
  });
});
