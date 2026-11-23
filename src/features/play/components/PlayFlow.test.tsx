import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBuiltinDeck } from "../../../content/decks";
import type { Deck } from "../../../content/types";
import {
  loadLastPlayOptions,
  saveLastPlayOptions,
} from "../../../storage/lastPlayOptions";
import { loadProgress, saveProgress } from "../../../storage/progress";
import { statsStore } from "../../../storage/stats";
import { makeCard, makeDeck, makeOptions } from "../engine/engine.testUtils";
import { REPLACE_CONFIRMED_STATE } from "../setup/replaceConfirmation";
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

/** Leaves for the deck list, and goes Back to the play entry. */
const LeaveAndReturn = () => {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => void navigate("/decks")}>
        Leave play
      </button>
      <button type="button" onClick={() => void navigate(-1)}>
        Go back
      </button>
    </>
  );
};

const LocationProbe = () => {
  const location = useLocation();
  return (
    <>
      <p data-testid="location-search">{location.search}</p>
      <p data-testid="location-path">{location.pathname}</p>
      <p data-testid="location-state">{JSON.stringify(location.state)}</p>
    </>
  );
};

type FlowEntry = string | { pathname: string; state: unknown };

const renderFlow = (
  deck: Deck = makeDeck(),
  entry: FlowEntry = `/play/${deck.id}`
) => {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/play/first-date"
          element={
            <>
              <p>Saved game page</p>
              <LocationProbe />
            </>
          }
        />
        <Route
          path="/play/:deckId"
          element={
            <>
              <PlayFlow deck={deck} />
              <OpenGameOptions deckId={deck.id} />
              <LeaveAndReturn />
              <LocationProbe />
            </>
          }
        />
        <Route
          path="/decks"
          element={
            <>
              <p>Deck list</p>
              <LeaveAndReturn />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
  return userEvent.setup();
};

/**
 * A data router with a page before the game, so the history can be checked:
 * one Back from the game must leave it, not land on the same card again.
 */
const renderGameWithHistory = (entry: string) => {
  const deck = makeDeck();
  const router = createMemoryRouter(
    [
      { path: "/decks", element: <p>Page before the game</p> },
      {
        path: "/play/:deckId",
        element: (
          <>
            <PlayFlow deck={deck} />
            <LeaveAndReturn />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: ["/decks", entry], initialIndex: 1 }
  );
  render(<RouterProvider router={router} />);
  return userEvent.setup();
};

const openGameOptionsFromMenu = async (
  user: ReturnType<typeof userEvent.setup>
) => {
  await user.click(screen.getByRole("button", { name: "Open game menu" }));
  await user.click(screen.getByRole("link", { name: "Game options" }));
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

const requireDeck = (deckId: string): Deck => {
  const deck = getBuiltinDeck(deckId);
  if (!deck) throw new Error(`Missing live deck ${deckId}`);
  return deck;
};

/** A real builtin deck's game, so the saved deck resolves for the dialog. */
const saveBuiltinGame = (deckId: string, position: number) =>
  saveGame(
    deckId,
    requireDeck(deckId).cards.map((card) => card.id),
    position
  );

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

  it("opens Game options for ?setup=1, then starts over and remembers the options", async () => {
    saveGame("a", ["a-002", "a-004", "a-007"], 1);
    const user = renderFlow(makeDeck(), "/play/a?setup=1");
    expect(screen.getByText("Game options")).toBeInTheDocument();
    // The running game's options fill the form.
    expect(screen.getByRole("textbox", { name: "Player 3 name" })).toHaveValue(
      "Inês"
    );

    await user.click(screen.getByRole("radio", { name: /Deeper/ }));
    await user.click(
      screen.getByRole("button", { name: "Start over with these settings" })
    );

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
      screen.getByRole("button", { name: "Save and continue" })
    ).toBeInTheDocument();
  });

  describe("Game options during a game of this deck", () => {
    const saveUnnamedGame = (options = makeOptions()) =>
      saveProgress({
        deckId: "a",
        order: ["a-002", "a-004", "a-007"],
        position: 1,
        hiddenCardIds: [],
        turnIndex: 0,
        firstStarterIndex: 0,
        turnSeed: 42,
        options,
        startedAt: 1,
        updatedAt: 2,
      });

    it("goes back to the same card", async () => {
      saveUnnamedGame();
      const user = renderFlow(makeDeck(), "/play/a?setup=1");
      await user.click(screen.getByRole("link", { name: "Back to game" }));
      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
      expect(screen.getByTestId("location-search")).not.toHaveTextContent(
        "setup"
      );
      expect(statsStore.get().decksStarted).toEqual({});
    });

    it("saves new names and continues on the same card with their turn line", async () => {
      saveUnnamedGame();
      const user = renderFlow(makeDeck(), "/play/a?setup=1");
      await user.type(
        screen.getByRole("textbox", { name: "Player 1 name" }),
        "Ana"
      );
      await user.type(
        screen.getByRole("textbox", { name: "Player 2 name" }),
        "Rui"
      );
      await user.click(screen.getByRole("button", { name: "Add player" }));
      await user.type(
        screen.getByRole("textbox", { name: "Player 3 name" }),
        "Eva"
      );
      await user.click(
        screen.getByRole("button", { name: "Save and continue" })
      );

      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
      expect(screen.getByText("Eva asks, Ana answers")).toBeInTheDocument();
      expect(loadProgress()).toMatchObject({
        order: ["a-002", "a-004", "a-007"],
        position: 1,
        turnSeed: 42,
        startedAt: 1,
        options: makeOptions({ players: ["Ana", "Rui", "Eva"] }),
      });
      expect(loadLastPlayOptions()?.players).toEqual(["Ana", "Rui", "Eva"]);
      // Not a new game: no start is counted.
      expect(statsStore.get().decksStarted).toEqual({});
      expect(screen.getByTestId("location-search")).not.toHaveTextContent(
        "setup"
      );
    });

    it("keeps a once-skipped card's mark through Save and continue, so a second skip hides it", async () => {
      saveGame("a", ["a-002", "a-004", "a-007", "a-001"], 0);
      const user = renderFlow();
      expect(screen.getByText("Card 1 of 4")).toBeInTheDocument();
      // a-002, then a-004, go to the end: a-007, a-001, a-002, a-004.
      await user.click(screen.getByRole("button", { name: "Skip for now" }));
      await user.click(screen.getByRole("button", { name: "Skip for now" }));
      await user.click(
        screen.getByRole("button", { name: "Open game options" })
      );
      await user.click(
        screen.getByRole("button", { name: "Save and continue" })
      );
      await user.click(screen.getByRole("button", { name: "Next card" }));
      await user.click(screen.getByRole("button", { name: "Next card" }));
      expect(screen.getByText("Card 3 of 4")).toBeInTheDocument();
      // a-002 was skipped once already, so this skip hides it.
      await user.click(screen.getByRole("button", { name: "Skip for now" }));
      expect(screen.getByText("Card 3 of 3")).toBeInTheDocument();
      expect(loadProgress()).toMatchObject({
        order: ["a-007", "a-001", "a-004"],
        hiddenCardIds: ["a-002"],
        skippedCardIds: ["a-004"],
      });
    });

    it("does not let Save and continue drop below the current card's level, but Start over can", async () => {
      // Deeper, on a-003 (level 3).
      saveProgress({
        deckId: "a",
        order: ["a-001", "a-003", "a-005"],
        position: 1,
        hiddenCardIds: [],
        turnIndex: 1,
        options: makeOptions({ startLevel: 2 }),
        startedAt: 1,
        updatedAt: 2,
      });
      const user = renderFlow(makeDeck(), "/play/a?setup=1");
      await user.click(screen.getByRole("radio", { name: /Warm/ }));
      expect(
        screen.getByText("You're past this level. Start over to play it.")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Save and continue" })
      ).toBeDisabled();
      await user.click(
        screen.getByRole("button", { name: "Start over with these settings" })
      );
      expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
      expect(loadProgress()?.options.startLevel).toBe(1);
    });

    it("continues an adult deck without the check-in again", async () => {
      saveUnnamedGame();
      const user = renderFlow(
        { ...makeDeck(), isAdult: true },
        "/play/a?setup=1"
      );
      await user.click(
        screen.getByRole("button", { name: "Save and continue" })
      );
      expect(
        screen.queryByRole("heading", { name: "Before you start" })
      ).not.toBeInTheDocument();
      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    });

    it("keeps the running game's buttons when the check-in goes back to Game options", async () => {
      saveUnnamedGame();
      const user = renderFlow(
        { ...makeDeck(), isAdult: true },
        "/play/a?setup=1"
      );
      await user.click(
        screen.getByRole("button", { name: "Start over with these settings" })
      );
      await user.click(screen.getByRole("button", { name: "Back to setup" }));
      expect(
        screen.getByRole("button", { name: "Save and continue" })
      ).toBeInTheDocument();
    });
  });

  describe("history around Game options opened from the play menu", () => {
    const saveRunningGame = () => saveGame("a", ["a-002", "a-004", "a-007"], 1);

    const expectBackLeavesTheGame = async (
      user: ReturnType<typeof userEvent.setup>
    ) => {
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        /^\?card=2$/
      );
      await user.click(screen.getByRole("button", { name: "Go back" }));
      expect(screen.getByText("Page before the game")).toBeInTheDocument();
    };

    it("Back to game pops the Game options entry, so one Back leaves the game", async () => {
      saveRunningGame();
      const user = renderGameWithHistory("/play/a?card=2");
      await openGameOptionsFromMenu(user);
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        /^\?setup=1$/
      );

      await user.click(screen.getByRole("link", { name: "Back to game" }));
      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
      await expectBackLeavesTheGame(user);
    });

    it("Save and continue pops the Game options entry and shows the new options on the same card", async () => {
      saveRunningGame();
      const user = renderGameWithHistory("/play/a?card=2");
      await openGameOptionsFromMenu(user);
      const player1 = screen.getByRole("textbox", {
        name: "Player 1 name",
      });
      await user.clear(player1);
      await user.type(player1, "Ana");
      const player2 = screen.getByRole("textbox", {
        name: "Player 2 name",
      });
      await user.clear(player2);
      await user.type(player2, "Rui");
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const player3 = screen.getByRole("textbox", { name: "Player 3 name" });
      await user.clear(player3);
      await user.type(player3, "Eva");
      await user.click(
        screen.getByRole("button", { name: "Save and continue" })
      );

      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
      expect(loadProgress()).toMatchObject({
        position: 1,
        options: makeOptions({ players: ["Ana", "Rui", "Eva"] }),
      });
      await expectBackLeavesTheGame(user);
    });

    it("keeps replacing when ?setup=1 was opened by URL, so Back leaves the game as before", async () => {
      saveRunningGame();
      const user = renderGameWithHistory("/play/a?setup=1");
      await user.click(screen.getByRole("link", { name: "Back to game" }));
      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        /^\?card=2$/
      );
      await user.click(screen.getByRole("button", { name: "Go back" }));
      expect(screen.getByText("Page before the game")).toBeInTheDocument();
    });

    it("keeps replacing on Save and continue when ?setup=1 was opened by URL", async () => {
      saveRunningGame();
      const user = renderGameWithHistory("/play/a?setup=1");
      await user.click(
        screen.getByRole("button", { name: "Save and continue" })
      );
      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
      await expectBackLeavesTheGame(user);
    });
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
  describe("replacing another deck's saved game", () => {
    const savedCardCount = requireDeck("first-date").cards.length;

    it("asks before replacing another deck's saved game opened by URL, before anything is saved", () => {
      saveBuiltinGame("first-date", 2);
      renderFlow();
      expect(
        screen.getByRole("dialog", { name: "Replace your First Date game?" })
      ).toBeInTheDocument();
      expect(
        screen.getByText(`You are on card 3 of ${savedCardCount}.`)
      ).toBeInTheDocument();
      expect(loadProgress()?.deckId).toBe("first-date");
      expect(statsStore.get().decksStarted.a).toBeUndefined();
      expect(screen.queryByText(/^Card \d+ of/)).not.toBeInTheDocument();
    });

    it("Start replaces the saved game and counts the start once", async () => {
      saveBuiltinGame("first-date", 2);
      const user = renderFlow();
      await user.click(screen.getByRole("button", { name: "Start A" }));
      expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
      expect(loadProgress()?.deckId).toBe("a");
      expect(statsStore.get().decksStarted).toEqual({ a: 1 });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("Keep goes back to the saved game", async () => {
      saveBuiltinGame("first-date", 2);
      const user = renderFlow();
      expect(
        screen.getByRole("button", { name: "Keep First Date" })
      ).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Keep First Date" }));
      expect(screen.getByTestId("location-path")).toHaveTextContent(
        "/play/first-date"
      );
      expect(loadProgress()?.deckId).toBe("first-date");
      expect(statsStore.get().decksStarted).toEqual({});
    });

    it("does not ask when the start was confirmed on the way in", () => {
      saveBuiltinGame("first-date", 2);
      renderFlow(makeDeck(), {
        pathname: "/play/a",
        state: REPLACE_CONFIRMED_STATE,
      });
      expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(loadProgress()?.deckId).toBe("a");
    });

    it("keeps the card number in the URL while it clears the confirmed state", () => {
      saveBuiltinGame("first-date", 2);
      renderFlow(makeDeck(), {
        pathname: "/play/a",
        state: REPLACE_CONFIRMED_STATE,
      });
      expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        /^\?card=1$/
      );
      expect(screen.getByTestId("location-state")).toHaveTextContent(/^null$/);
    });

    it("asks again when Back returns to an entry that was confirmed earlier", async () => {
      saveBuiltinGame("first-date", 2);
      // An adult deck waits on the check-in, so the play screen has not
      // rewritten the URL: the confirmed state is still on the history entry.
      const user = renderFlow(
        { ...makeDeck(), isAdult: true },
        { pathname: "/play/a", state: REPLACE_CONFIRMED_STATE }
      );
      expect(
        screen.getByRole("heading", { name: "Before you start" })
      ).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Leave play" }));
      await user.click(screen.getByRole("button", { name: "Go back" }));

      expect(
        screen.getByRole("dialog", { name: "Replace your First Date game?" })
      ).toBeInTheDocument();
      expect(loadProgress()?.deckId).toBe("first-date");
    });

    it("does not ask for Game options", () => {
      saveBuiltinGame("first-date", 2);
      renderFlow(makeDeck(), "/play/a?setup=1");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByText(
          "Starting this deck replaces your saved game of First Date."
        )
      ).toBeInTheDocument();
    });

    it("does not ask when the saved deck no longer exists", () => {
      saveGame("custom-gone1234", ["custom-gone1234-001"], 0);
      renderFlow();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Card 1 of 9")).toBeInTheDocument();
    });

    it("does not ask when the saved game is this deck", () => {
      saveGame("a", ["a-002", "a-004", "a-007"], 1);
      renderFlow();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    });

    it("asks before an adult deck's check-in, and Start continues to the check-in", async () => {
      saveBuiltinGame("first-date", 2);
      const user = renderFlow({ ...makeDeck(), isAdult: true });
      expect(
        screen.queryByRole("heading", { name: "Before you start" })
      ).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Start A" }));
      expect(
        screen.getByRole("heading", { name: "Before you start" })
      ).toBeInTheDocument();
      expect(loadProgress()?.deckId).toBe("first-date");
    });
  });
});
