import { afterEach, describe, expect, it, vi } from "vitest";
import { shareLink } from "./shareLink";

describe("shareLink", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the share sheet when there is one", async () => {
    const share = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { share });
    expect(
      await shareLink({
        title: "First Date",
        text: "Line",
        url: "https://example.test/decks/first-date",
      })
    ).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: "First Date",
      text: "Line",
      url: "https://example.test/decks/first-date",
    });
  });

  it("leaves out the fields it was not given", async () => {
    const share = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { share });
    await shareLink({ url: "https://example.test/" });
    expect(share).toHaveBeenCalledWith({ url: "https://example.test/" });
  });

  it("reports a closed share sheet as cancelled and copies nothing", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", {
      share: () => Promise.reject(new DOMException("closed", "AbortError")),
      clipboard: { writeText },
    });
    expect(await shareLink({ url: "https://example.test/" })).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link when there is no share sheet", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(
      await shareLink({ text: "Line", url: "https://example.test/" })
    ).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://example.test/");
  });

  it("copies the clipboard text when the share sheet refuses", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", {
      share: () => Promise.reject(new DOMException("no", "NotAllowedError")),
      clipboard: { writeText },
    });
    expect(
      await shareLink({
        text: "Line",
        url: "https://example.test/",
        clipboardText: "Line https://example.test/",
      })
    ).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("Line https://example.test/");
  });

  it("reports unavailable when neither sharing nor the clipboard works", async () => {
    vi.stubGlobal("navigator", {});
    expect(await shareLink({ url: "https://example.test/" })).toBe(
      "unavailable"
    );
  });

  it("reports unavailable when the clipboard is blocked", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: () => Promise.reject(new Error("blocked")) },
    });
    expect(await shareLink({ url: "https://example.test/" })).toBe(
      "unavailable"
    );
  });
});
