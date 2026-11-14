import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Deck } from "../../../content/types";
import { getFavouriteIds } from "../../../storage/favourites";
import { loadProgress, type PlayOptions } from "../../../storage/progress";
import { makeCard, makeDeck, makeOptions } from "../engine/engine.testUtils";
import { createSession } from "../engine/playReducer";
import { PlayScreen } from "./PlayScreen";

vi.mock("../../share/shareCard", () => ({
  shareCardImage: vi.fn(() => Promise.resolve("downloaded")),
}));

// Builtin ids, so the favourite star shows; plain text equal to the id.
const threeCards = [
  makeCard("first-date-001", 1),
  makeCard("first-date-002", 1, "challenge"),
  makeCard("first-date-003", 1, "everyone"),
];

const renderPlayScreen = (
  deckPatch: Partial<Deck> = {},
  optionsPatch: Partial<PlayOptions> = {}
) => {
  const deck = { ...makeDeck(threeCards), ...deckPatch };
  // Unshuffled, so the only random draw is the two player starter: 0 picks player 1.
  const session = createSession(deck, makeOptions(optionsPatch), 0, () => 0);
  render(
    <MemoryRouter initialEntries={[`/play/${deck.id}`]}>
      <Routes>
        <Route
          path="/play/:deckId"
          element={<PlayScreen deck={deck} initialSession={session} />}
        />
        <Route path="/play/:deckId/done" element={<p>End screen</p>} />
      </Routes>
    </MemoryRouter>
  );
  return userEvent.setup();
};

const nextButton = () =>
  screen.getByRole("button", { name: /Next card|Finish deck/ });

describe("PlayScreen controls", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("moves forward and back with the buttons", async () => {
    const user = renderPlayScreen();
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous card" })
    ).toHaveAttribute("aria-disabled", "true");

    await user.click(nextButton());
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous card" }));
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("moves with the arrow keys and Space", async () => {
    const user = renderPlayScreen();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
  });

  it("saves progress after every move", async () => {
    const user = renderPlayScreen();
    await user.click(nextButton());
    expect(loadProgress()?.position).toBe(1);
  });

  it("skip moves the card to the end and Not tonight removes it", async () => {
    const user = renderPlayScreen();
    await user.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(loadProgress()?.order).toEqual([
      "first-date-002",
      "first-date-003",
      "first-date-001",
    ]);

    await user.click(screen.getByRole("button", { name: "Not tonight" }));
    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
  });

  it("offers Pass on adult decks only", () => {
    renderPlayScreen({ isAdult: true });
    expect(screen.getByRole("button", { name: "Pass" })).toBeInTheDocument();
  });

  it("has no Pass on other decks", () => {
    renderPlayScreen();
    expect(
      screen.queryByRole("button", { name: "Pass" })
    ).not.toBeInTheDocument();
  });

  it("rotates who asks and who answers with three or more players", () => {
    renderPlayScreen({}, { players: ["Ana", "Rui", "Eva"] });
    expect(screen.getByText("Eva asks, Ana answers")).toBeInTheDocument();
  });

  it("has both of two players answer and swaps who starts on the next card", async () => {
    const user = renderPlayScreen({}, { players: ["Ana", "Rui"] });
    expect(screen.getByText("Ana answers first, then Rui")).toBeInTheDocument();
    await user.click(nextButton());
    expect(screen.getByText("Rui goes first, then Ana")).toBeInTheDocument();
  });

  it("tells everyone to answer when nobody is named", () => {
    renderPlayScreen();
    expect(
      screen.getByText("Everyone answers. One of you starts, then pass it on")
    ).toBeInTheDocument();
  });

  it("labels challenge and everyone cards", async () => {
    const user = renderPlayScreen();
    await user.click(nextButton());
    expect(screen.getAllByText("Challenge").length).toBeGreaterThan(0);
    await user.click(nextButton());
    expect(screen.getAllByText("Everyone answers").length).toBeGreaterThan(0);
  });

  it("saves the card to favourites with the star", async () => {
    const user = renderPlayScreen();
    const star = screen.getByRole("button", {
      name: "Save card to favourites",
    });
    expect(star).toHaveAttribute("aria-pressed", "false");
    await user.click(star);
    expect(star).toHaveAttribute("aria-pressed", "true");
    expect(getFavouriteIds()).toEqual(["first-date-001"]);
  });

  it("prints the card twice in table mode and hides the turned copy from screen readers", () => {
    renderPlayScreen({}, { isTableMode: true });
    const copies = screen.getAllByText("first-date-001", { selector: "p" });
    expect(copies).toHaveLength(2);
    const turnedCopy = copies[0]?.closest(".play-card__face--across");
    expect(turnedCopy).toHaveAttribute("aria-hidden", "true");
    expect(copies[1]?.closest("[aria-hidden='true']")).toBeNull();
  });

  it("keeps the card when the star is tapped", async () => {
    const user = renderPlayScreen();
    await user.click(
      screen.getByRole("button", { name: "Save card to favourites" })
    );
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("ignores the arrow keys while the game menu is open", async () => {
    const user = renderPlayScreen();
    await user.click(screen.getByRole("button", { name: "Open game menu" }));
    expect(
      screen.getByRole("dialog", { name: "Game menu" })
    ).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("includes whose turn it is in the card announcement", () => {
    renderPlayScreen({}, { players: ["Ana", "Rui"] });
    expect(
      screen.getByText(
        "Card 1 of 3. Ana answers first, then Rui. first-date-001"
      )
    ).toBeInTheDocument();
  });

  it("announces the everyone line when nobody is named", () => {
    renderPlayScreen();
    expect(
      screen.getByText(
        "Card 1 of 3. Everyone answers. One of you starts, then pass it on. first-date-001"
      )
    ).toBeInTheDocument();
  });

  it("finishes on the last card and clears the saved game", async () => {
    const user = renderPlayScreen();
    await user.click(nextButton());
    await user.click(nextButton());
    expect(
      screen.getByRole("button", { name: "Finish deck" })
    ).toBeInTheDocument();
    await user.click(nextButton());
    expect(await screen.findByText("End screen")).toBeInTheDocument();
    expect(loadProgress()).toBeNull();
  });
});
