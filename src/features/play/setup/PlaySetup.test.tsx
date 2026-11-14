import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveProgress } from "../../../storage/progress";
import { makeDeck, mixedCards } from "../engine/engine.testUtils";
import { PlaySetup } from "./PlaySetup";

const renderSetup = (deck = makeDeck()) => {
  const onStart = vi.fn();
  render(
    <MemoryRouter>
      <PlaySetup deck={deck} onStart={onStart} />
    </MemoryRouter>
  );
  return { onStart, user: userEvent.setup() };
};

describe("PlaySetup", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows how many cards each start level gives", () => {
    renderSetup();
    const levels = screen.getByRole("group", { name: "Start level" });
    expect(
      within(levels).getByRole("radio", { name: /Warm.*9 cards/ })
    ).toBeChecked();
    expect(
      within(levels).getByRole("radio", { name: /Deeper.*6 cards/ })
    ).toBeInTheDocument();
    expect(
      within(levels).getByRole("radio", { name: /All in.*3 cards/ })
    ).toBeInTheDocument();
  });

  it("starts with the chosen names, level, shuffle and table mode", async () => {
    const { onStart, user } = renderSetup();
    await user.type(
      screen.getByRole("textbox", { name: "Player 1 name" }),
      "Ana"
    );
    await user.type(
      screen.getByRole("textbox", { name: "Player 2 name" }),
      "Rui"
    );
    await user.click(screen.getByRole("radio", { name: /Deeper/ }));
    await user.click(screen.getByRole("switch", { name: /Shuffle cards/ }));
    await user.click(screen.getByRole("switch", { name: /Table mode/ }));
    await user.click(screen.getByRole("button", { name: "Start deck" }));

    expect(onStart).toHaveBeenCalledWith({
      isShuffled: true,
      startLevel: 2,
      isTableMode: true,
      players: ["Ana", "Rui"],
    });
  });

  it("quick start uses the defaults whatever the form says", async () => {
    const { onStart, user } = renderSetup();
    await user.click(screen.getByRole("switch", { name: /Shuffle cards/ }));
    await user.click(screen.getByRole("button", { name: "Quick start" }));

    expect(onStart).toHaveBeenCalledWith({
      isShuffled: false,
      startLevel: 1,
      isTableMode: false,
      players: [],
    });
  });

  it("explains that two players both answer and a third name brings turns", () => {
    renderSetup();
    const players = screen.getByRole("group", { name: "Players" });
    expect(
      within(players).getByText(
        "With two players you both answer every card. Add a third name to take turns asking."
      )
    ).toBeInTheDocument();
  });

  it("adds players up to ten and then explains the limit", async () => {
    const { user } = renderSetup();
    for (let addedCount = 0; addedCount < 8; addedCount += 1) {
      await user.click(screen.getByRole("button", { name: "Add player" }));
    }
    expect(screen.getAllByRole("textbox")).toHaveLength(10);
    expect(
      screen.queryByRole("button", { name: "Add player" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Ten players is the most a game can hold.")
    ).toBeInTheDocument();
  });

  it("removes a player row", async () => {
    const { user } = renderSetup();
    await user.click(screen.getByRole("button", { name: "Remove player 2" }));
    // The row animates out first, then leaves the DOM.
    await waitFor(() => expect(screen.getAllByRole("textbox")).toHaveLength(1));
  });

  it("hides the start level for custom decks", () => {
    renderSetup({ ...makeDeck(), id: "custom-abc1234567" });
    expect(
      screen.queryByRole("group", { name: "Start level" })
    ).not.toBeInTheDocument();
  });

  it("disables starting when the deck has no cards", () => {
    renderSetup(makeDeck([]));
    expect(screen.getByRole("button", { name: "Start deck" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quick start" })).toBeDisabled();
  });

  it("warns that a saved game of another deck will be replaced", () => {
    saveProgress({
      deckId: "first-date",
      order: ["first-date-001", "first-date-002"],
      position: 1,
      hiddenCardIds: [],
      turnIndex: 1,
      options: {
        isShuffled: false,
        startLevel: 1,
        isTableMode: false,
        players: [],
      },
      startedAt: 1,
      updatedAt: 2,
    });
    renderSetup(makeDeck(mixedCards));
    expect(
      screen.getByText(
        "Starting this deck replaces your saved game of First Date."
      )
    ).toBeInTheDocument();
  });
});
