import { describe, expect, it } from "vitest";
import { FAVOURITES_DECK_ID } from "../../content/types";
import { buildDeckShareUrl } from "./deckShareUrl";

describe("buildDeckShareUrl", () => {
  it("links a builtin deck to its page", () => {
    expect(buildDeckShareUrl("first-date", "https://x.test")).toBe(
      "https://x.test/decks/first-date"
    );
  });

  it("links favourites and custom decks to the home page", () => {
    expect(buildDeckShareUrl(FAVOURITES_DECK_ID, "https://x.test")).toBe(
      "https://x.test/"
    );
    expect(buildDeckShareUrl("custom-abc123", "https://x.test")).toBe(
      "https://x.test/"
    );
  });
});
