import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shareCardImage, type ShareCardInput } from "./shareCard";

const input: ShareCardInput = {
  cardText: "What is a small thing you never forget?",
  deckTitle: "First Date",
  deckId: "first-date",
  accent: "#eebbc3",
  locale: "en",
  shareText: "A card from First Date on Unravel",
  shareUrl: "https://x.test/decks/first-date",
};

describe("shareCardImage", () => {
  beforeEach(() => {
    const context = new Proxy(
      {},
      {
        get: (_target, property) =>
          property === "measureText"
            ? () => ({ width: 10 })
            : property === "createRadialGradient" ||
                property === "createLinearGradient"
              ? () => ({ addColorStop: () => undefined })
              : () => undefined,
        set: () => true,
      }
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => callback(new Blob(["png"], { type: "image/png" }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shares the image with a line of text and the deck link", async () => {
    const share = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { share, canShare: () => true });
    expect(await shareCardImage(input)).toBe("shared");
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({
      files: [expect.any(File)],
      title: "First Date",
      text: "A card from First Date on Unravel",
      url: "https://x.test/decks/first-date",
    });
  });

  it("retries with the image only when files plus a link are refused", async () => {
    const share = vi.fn(() => Promise.resolve());
    const canShare = vi.fn(
      (data: ShareData) => data.url === undefined && data.text === undefined
    );
    vi.stubGlobal("navigator", { share, canShare });
    expect(await shareCardImage(input)).toBe("shared");
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({
      files: [expect.any(File)],
      title: "First Date",
    });
  });

  it("retries with the image only when the share sheet rejects the link", async () => {
    const share = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("no", "NotAllowedError"))
      .mockResolvedValueOnce(undefined);
    vi.stubGlobal("navigator", { share, canShare: () => true });
    expect(await shareCardImage(input)).toBe("shared");
    expect(share).toHaveBeenCalledTimes(2);
    expect(share).toHaveBeenLastCalledWith({
      files: [expect.any(File)],
      title: "First Date",
    });
  });

  it("reports a closed share sheet as cancelled without retrying", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("closed", "AbortError"));
    vi.stubGlobal("navigator", { share, canShare: () => true });
    expect(await shareCardImage(input)).toBe("cancelled");
    expect(share).toHaveBeenCalledTimes(1);
  });
});
