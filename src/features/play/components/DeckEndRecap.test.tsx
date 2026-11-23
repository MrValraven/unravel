import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeckEndRecap } from "./DeckEndRecap";

const endState = {
  cardsPlayed: 48,
  millisecondsPlayed: 52 * 60_000,
  favouritesSavedCount: 0,
  options: {
    isShuffled: false,
    startLevel: 3 as const,
    isTableMode: false,
    isRandomTurns: false,
    isPassThePhone: false,
    players: [],
  },
};

describe("DeckEndRecap", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "share");
    vi.restoreAllMocks();
  });

  it("copies the recap and says so when there is no share sheet", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(
      <DeckEndRecap
        deckId="first-date"
        deckTitle="First Date"
        endState={endState}
      />
    );
    expect(
      screen.getByText("We went All in on First Date: 48 cards, 52 min.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Share recap" }));
    expect(writeText).toHaveBeenCalledWith(
      `We went All in on First Date: 48 cards, 52 min. ${window.location.origin}/decks/first-date`
    );
    expect(screen.getByRole("status")).toHaveTextContent("Recap copied");
  });

  it("shows the link to copy by hand when sharing and the clipboard both fail", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("blocked")
    );
    render(
      <DeckEndRecap
        deckId="first-date"
        deckTitle="First Date"
        endState={endState}
      />
    );
    await user.click(screen.getByRole("button", { name: "Share recap" }));
    const dialog = screen.getByRole("dialog", { name: "Copy this link" });
    expect(dialog).toHaveAccessibleDescription(
      "Your browser blocked both sharing and the clipboard. Select the link and copy it."
    );
    // The recap sentence travels with the link, as it would have on the clipboard.
    expect(screen.getByLabelText("Link")).toHaveValue(
      `We went All in on First Date: 48 cards, 52 min. ${window.location.origin}/decks/first-date`
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("ignores a second tap on Share while the share sheet is still open", async () => {
    const user = userEvent.setup();
    let closeSheet = () => {};
    const share = vi.fn((data: ShareData) => {
      void data;
      // The first sheet stays open; a second call is refused, as browsers do.
      if (share.mock.calls.length > 1)
        return Promise.reject(new DOMException("busy", "InvalidStateError"));
      return new Promise<void>((resolve) => {
        closeSheet = resolve;
      });
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(
      <DeckEndRecap
        deckId="first-date"
        deckTitle="First Date"
        endState={endState}
      />
    );
    const shareButton = screen.getByRole("button", { name: "Share recap" });
    await user.click(shareButton);
    await user.click(shareButton);
    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await act(async () => closeSheet());
    share.mockClear();
    share.mockResolvedValue(undefined);
    await user.click(shareButton);
    expect(share).toHaveBeenCalledTimes(1);
  });

  it("links a favourites recap to the home page", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(
      <DeckEndRecap
        deckId="favourites"
        deckTitle="Favourites"
        endState={endState}
      />
    );
    await user.click(screen.getByRole("button", { name: "Share recap" }));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`${window.location.origin}/$`))
    );
  });
});
