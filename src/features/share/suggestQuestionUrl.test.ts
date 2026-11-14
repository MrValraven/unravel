import { describe, expect, it } from "vitest";
import { buildSuggestQuestionUrl } from "./suggestQuestionUrl";

const parse = (url: string) => new URL(url);

describe("buildSuggestQuestionUrl", () => {
  it("points at the new-issue form of the Unravel repository", () => {
    const url = parse(buildSuggestQuestionUrl());
    expect(url.origin + url.pathname).toBe(
      "https://github.com/MrValraven/unravel/issues/new"
    );
  });

  it("uses a generic title without a deck", () => {
    const url = parse(buildSuggestQuestionUrl());
    expect(url.searchParams.get("title")).toBe("Question idea");
  });

  it("names the deck in the title and the body", () => {
    const url = parse(buildSuggestQuestionUrl("First date"));
    expect(url.searchParams.get("title")).toBe("Question idea for First date");
    expect(url.searchParams.get("body")).toContain("First date");
  });

  it("asks for the question text and the deck in the body", () => {
    const body =
      parse(buildSuggestQuestionUrl()).searchParams.get("body") ?? "";
    expect(body).toContain("Question text:");
    expect(body).toContain("Which deck does it fit?");
  });

  it("encodes special characters so the deck title survives the round trip", () => {
    const url = parse(buildSuggestQuestionUrl("Rock & Roll #1"));
    expect(url.searchParams.get("title")).toBe(
      "Question idea for Rock & Roll #1"
    );
  });

  it("treats a blank deck title as no deck", () => {
    const url = parse(buildSuggestQuestionUrl("   "));
    expect(url.searchParams.get("title")).toBe("Question idea");
  });
});
