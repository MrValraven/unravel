import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Deck } from "../../../content/types";
import {
  loadLastPlayOptions,
  saveLastPlayOptions,
} from "../../../storage/lastPlayOptions";
import { loadProgress, saveProgress } from "../../../storage/progress";
import { statsStore } from "../../../storage/stats";
import { makeCard, makeDeck, makeOptions } from "../engine/engine.testUtils";
import { PlayFlow } from "./PlayFlow";

vi.mock("../../share/shareCard", () => ({
  shareCardImage: vi.fn(() => Promise.resolve("downloaded")),
}));

/** Stands in for the play menu's Game options entry, which links to ?setup=1. */
const OpenGameOptions = ({ deckId }: { deckId: string }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => void navigate(`/play/${deckId}?setup=1`)}
    >
      Open game options
    </button>
  );
};

const LocationProbe = () => (
  <p data-testid="location-search">{useLocation().search}</p>
);

const renderFlow = (deck: Deck = makeDeck(), entry = `/play/${deck.id}`) => {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/play/:deckId"
          element={
            <>
              <PlayFlow deck={deck} />
              <OpenGameOptions deckId={deck.id} />
              <LocationProbe />
            </>
          }
        />
        <Route path="/decks" element={<p>Deck list</p>} />
      </Routes>
    </MemoryRouter>
  );
  return userEvent.setup();
};

const saveGame = (deckId: string, order: string[], position: number) =>
  saveProgress({
    deckId,
    order,
    position,
    hiddenCardIds: [],
    turnIndex: 0,
    options: makeOptions({ players: ["Ana", "Rui", "Inês"] }),
    startedAt: 1,
    updatedAt: 2,
  });

describe("PlayFlow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("goes straight into play with the defaults the first time, and counts the start once", () => {
    renderFlow();
    expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start deck" })
    ).not.toBeInTheDocument();
    expect(loadProgress()?.deckId).toBe("a");
    expect(loadProgress()?.options).toEqual(makeOptions());
    expect(statsStore.get().decksStarted).toEqual({ a: 1 });
  });

  it("starts with the last-used options", () => {
    saveLastPlayOptions(
      makeOptions({ startLevel: 3, players: ["Ana", "Rui"] })
    );
    renderFlow();
    // Three cards per level in the test deck, so All in deals three.
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(loadProgress()?.options.players).toEqual(["Ana", "Rui"]);
  });

  it("falls back to the first level when the last-used level has no cards here", () => {
    saveLastPlayOptions(makeOptions({ startLevel: 3 }));
    renderFlow(makeDeck([makeCard("a-001", 1), makeCard("a-002", 2)]));
    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
  });

  it("resumes a saved game of this deck", () => {
    saveGame("a", ["a-002", "a-004", "a-007"], 1);
    renderFlow();
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(statsStore.get().decksStarted).toEqual({});
  });

  it("opens Game options for ?setup=1, then starts fresh and remembers the options", async () => {
    saveGame("a", ["a-002", "a-004", "a-007"], 1);
    const user = renderFlow(makeDeck(), "/play/a?setup=1");
    expect(screen.getByText("Game options")).toBeInTheDocument();
    // The running game's options fill the form.
    expect(screen.getByRole("textbox", { name: "Player 3 name" })).toHaveValue(
      "Inês"
    );

    await user.click(screen.getByRole("radio", { name: /Deeper/ }));
    await user.click(screen.getByRole("button", { name: "Start deck" }));

    expect(screen.getByText("Card 1 of 6")).toBeInTheDocument();
    expect(loadLastPlayOptions()).toEqual(
      makeOptions({ startLevel: 2, players: ["Ana", "Rui", "Inês"] })
    );
    expect(loadProgress()?.position).toBe(0);
    // setup=1 leaves the URL, so the card number sync runs again.
    expect(screen.getByTestId("location-search")).not.toHaveTextContent(
      "setup"
    );
  });

  it("switches a running game to Game options when the play menu links there", async () => {
    const user = renderFlow();
    expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open game options" }));
    expect(
      screen.getByRole("button", { name: "Start deck" })
    ).toBeInTheDocument();
  });

  it("shows Game options when the deck has no cards", () => {
    renderFlow(makeDeck([]));
    expect(screen.getByRole("button", { name: "Start deck" })).toBeDisabled();
  });

  it("runs an adult deck through the check-in, which links to Game options", async () => {
    const user = renderFlow({ ...makeDeck(), isAdult: true });
    expect(
      screen.getByRole("heading", { name: "Before you start" })
    ).toBeInTheDocument();
    expect(loadProgress()).toBeNull();

    await user.click(screen.getByRole("button", { name: "Game options" }));
    expect(
      screen.getByRole("button", { name: "Start deck" })
    ).toBeInTheDocument();
  });

  it("starts an adult deck after the check-in", async () => {
    const user = renderFlow({ ...makeDeck(), isAdult: true });
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
    expect(statsStore.get().decksStarted).toEqual({ a: 1 });
  });
});
