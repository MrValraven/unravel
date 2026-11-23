import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { getBuiltinDeck } from "../../content/decks";
import { saveCustomDeck } from "../../storage/customDecks";
import { saveProgress } from "../../storage/progress";
import CustomDecksPage from "./CustomDecksPage";

const PlayRouteProbe = () => <p>Playing {useParams().deckId}</p>;

const renderCustomDecks = () =>
  render(
    <MemoryRouter initialEntries={["/custom"]}>
      <Routes>
        <Route path="/custom" element={<CustomDecksPage />} />
        <Route path="/play/:deckId" element={<PlayRouteProbe />} />
      </Routes>
    </MemoryRouter>
  );

describe("CustomDecksPage starting a deck", () => {
  beforeEach(() => {
    localStorage.clear();
    saveCustomDeck({
      id: "custom-abcdefghij",
      title: "Our road trip",
      cards: [{ id: "c1", type: "question", text: "Best snack?" }],
      createdAt: 1,
      updatedAt: 1,
    });
  });

  it("starts straight away when nothing is saved", async () => {
    const user = userEvent.setup();
    renderCustomDecks();
    await user.click(
      screen.getByRole("link", { name: "Start deck Our road trip" })
    );
    expect(screen.getByText("Playing custom-abcdefghij")).toBeInTheDocument();
  });

  it("asks before replacing a saved game of another deck, and Keep stays on the list", async () => {
    const user = userEvent.setup();
    const savedDeck = getBuiltinDeck("unravel");
    if (!savedDeck) throw new Error("the unravel deck is missing");
    saveProgress({
      deckId: savedDeck.id,
      order: savedDeck.cards.map((card) => card.id),
      position: 1,
      hiddenCardIds: [],
      turnIndex: 0,
      options: {
        isShuffled: false,
        startLevel: 1,
        isTableMode: false,
        isRandomTurns: false,
        isPassThePhone: false,
        players: [],
      },
      startedAt: 1,
      updatedAt: 2,
    });
    renderCustomDecks();
    await user.click(
      screen.getByRole("link", { name: "Start deck Our road trip" })
    );
    const dialog = screen.getByRole("dialog", {
      name: "Replace your Unravel game?",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Keep Unravel" })
    );
    expect(
      screen.queryByText("Playing custom-abcdefghij")
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("link", { name: "Start deck Our road trip" })
    );
    await user.click(
      screen.getByRole("button", { name: "Start Our road trip" })
    );
    expect(screen.getByText("Playing custom-abcdefghij")).toBeInTheDocument();
  });
});

describe("CustomDecksPage sharing a deck", () => {
  beforeEach(() => {
    localStorage.clear();
    saveCustomDeck({
      id: "custom-abcdefghij",
      title: "Our road trip",
      cards: [{ id: "c1", type: "question", text: "Best snack?" }],
      createdAt: 1,
      updatedAt: 1,
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("copies the link and says so without a share sheet", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    renderCustomDecks();
    await user.click(
      screen.getByRole("button", { name: "Share a link to Our road trip" })
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(window.location.origin)
    );
    expect(await screen.findByText(/Link copied/)).toBeInTheDocument();
  });

  it("shows the link in a field when sharing and copying both fail", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("blocked")
    );
    renderCustomDecks();
    await user.click(
      screen.getByRole("button", { name: "Share a link to Our road trip" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Copy this link",
    });
    const field = within(dialog).getByLabelText("Link");
    expect(field).toHaveProperty(
      "value",
      expect.stringContaining(`${window.location.origin}/custom/import#d=`)
    );
  });
});
