import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveProgress, type PlayOptions } from "../../../storage/progress";
import { makeDeck, mixedCards } from "../engine/engine.testUtils";
import { PlaySetup } from "./PlaySetup";

const renderSetup = (deck = makeDeck(), initialOptions?: PlayOptions) => {
  const onStart = vi.fn();
  render(
    <MemoryRouter>
      <PlaySetup
        deck={deck}
        initialOptions={initialOptions}
        onStart={onStart}
      />
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

  it("has one Start button and no quick start", () => {
    renderSetup();
    expect(screen.getAllByRole("button", { name: /start/i })).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Quick start" })
    ).not.toBeInTheDocument();
  });

  it("opens with the options it is given and starts with them unchanged", async () => {
    const { onStart, user } = renderSetup(makeDeck(), {
      isShuffled: true,
      startLevel: 3,
      isTableMode: false,
      players: ["Ana", "Rui", "Inês"],
    });
    expect(screen.getByRole("radio", { name: /All in/ })).toBeChecked();
    expect(screen.getByRole("switch", { name: /Shuffle cards/ })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Player 3 name" })).toHaveValue(
      "Inês"
    );
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    expect(onStart).toHaveBeenCalledWith({
      isShuffled: true,
      startLevel: 3,
      isTableMode: false,
      players: ["Ana", "Rui", "Inês"],
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

  it("keeps the two first name rows, so they have no remove button", () => {
    renderSetup();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /Remove player/ })
    ).not.toBeInTheDocument();
  });

  it("removes a third player row, and the remove buttons go again at two", async () => {
    const { user } = renderSetup();
    await user.click(screen.getByRole("button", { name: "Add player" }));
    expect(
      screen.getAllByRole("button", { name: /Remove player/ })
    ).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Remove player 3" }));
    // The row animates out first, then leaves the DOM.
    await waitFor(() => expect(screen.getAllByRole("textbox")).toHaveLength(2));
    expect(
      screen.queryByRole("button", { name: /Remove player/ })
    ).not.toBeInTheDocument();
  });

  it("shows two name rows when the saved options hold a single name", () => {
    renderSetup(makeDeck(), {
      isShuffled: false,
      startLevel: 1,
      isTableMode: false,
      players: ["Ana"],
    });
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
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

  it("says that starting begins a saved game of this deck again", () => {
    saveProgress({
      deckId: "a",
      order: ["a-002", "a-004"],
      position: 1,
      hiddenCardIds: [],
      turnIndex: 0,
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
        "Starting with these options begins this deck again from the first card."
      )
    ).toBeInTheDocument();
  });
});
