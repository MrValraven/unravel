import { render, screen } from "@testing-library/react";
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
    players: [],
  },
};

describe("DeckEndRecap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the recap and says so when there is no share sheet", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(<DeckEndRecap deckTitle="First Date" endState={endState} />);
    expect(
      screen.getByText("We went All in on First Date: 48 cards, 52 min.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Share recap" }));
    expect(writeText).toHaveBeenCalledWith(
      `We went All in on First Date: 48 cards, 52 min. ${window.location.origin}/`
    );
    expect(screen.getByRole("status")).toHaveTextContent("Recap copied");
  });

  it("names the cause when the clipboard is blocked too", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("blocked")
    );
    render(<DeckEndRecap deckTitle="First Date" endState={endState} />);
    await user.click(screen.getByRole("button", { name: "Share recap" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "This browser blocked both sharing and the clipboard"
    );
  });
});
