import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Card, Deck } from "../../../content/types";
import { markCoachMarkSeen } from "../../../storage/coachMarks";
import { getFavouriteIds } from "../../../storage/favourites";
import { loadProgress, type PlayOptions } from "../../../storage/progress";
import { settingsStore } from "../../../storage/settings";
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
  optionsPatch: Partial<PlayOptions> = {},
  cards: Card[] = threeCards
) => {
  const deck = { ...makeDeck(cards), ...deckPatch };
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
        <Route path="/decks" element={<p>Deck list</p>} />
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
      screen.getByText("Everyone answers, one at a time")
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
        "Card 1 of 3. Everyone answers, one at a time. first-date-001"
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

  it("wears a type chip and a level chip on every card", () => {
    renderPlayScreen({}, {}, [
      makeCard("first-date-001", 2),
      makeCard("first-date-002", 3),
    ]);
    expect(screen.getAllByText("Question").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deeper").length).toBeGreaterThan(0);
  });

  it("marks the moment the deck goes a level deeper", async () => {
    const vibrate = vi.fn((_pattern: VibratePattern) => true);
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });
    const user = renderPlayScreen({}, {}, [
      makeCard("first-date-001", 1),
      makeCard("first-date-002", 1),
      makeCard("first-date-003", 2),
    ]);
    await user.click(nextButton());
    expect(screen.queryByText("Level 2: Deeper")).not.toBeInTheDocument();
    const tapPattern: unknown = vibrate.mock.calls.at(-1)?.[0];

    await user.click(nextButton());
    expect(
      screen.getByText("Level 2: Deeper", { selector: "[role='status']" })
    ).toBeInTheDocument();
    expect(vibrate.mock.calls.at(-1)?.[0]).not.toEqual(tapPattern);
    Reflect.deleteProperty(navigator, "vibrate");
  });

  it("thins the stack underneath as the deck runs down", async () => {
    const user = renderPlayScreen({}, {}, [
      makeCard("first-date-001", 1),
      makeCard("first-date-002", 1),
      makeCard("first-date-003", 1),
      makeCard("first-date-004", 1),
      makeCard("first-date-005", 1),
    ]);
    const stage = () => document.querySelector(".card-stage");
    expect(stage()).toHaveAttribute("data-cards-behind", "2");
    await user.click(nextButton());
    expect(stage()).toHaveAttribute("data-cards-behind", "1");
    await user.click(nextButton());
    await user.click(nextButton());
    await user.click(nextButton());
    expect(stage()).toHaveAttribute("data-cards-behind", "0");
  });
});

describe("PlayScreen first game hint", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const fiveCards = [1, 2, 3, 4, 5].map((number) =>
    makeCard(`first-date-00${number}`, 1)
  );
  const hint = () => document.querySelector(".play-screen__hint");

  it("explains the swipe and the keys on the first cards of the first game", async () => {
    const user = renderPlayScreen({}, {}, fiveCards);
    expect(
      screen.getByText("Swipe the card, or tap its right side, to move on.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Use the arrow keys or Space to move between cards.")
    ).toBeInTheDocument();
    expect(hint()).toHaveAttribute("data-visible", "true");

    await user.click(nextButton());
    await user.click(nextButton());
    expect(hint()).toHaveAttribute("data-visible", "true");
    await user.click(nextButton());
    expect(hint()).toHaveAttribute("data-visible", "false");
    expect(hint()).toHaveAttribute("aria-hidden", "true");
  });

  it("stays away once the first game has shown it", () => {
    markCoachMarkSeen("playGestureHint");
    renderPlayScreen({}, {}, fiveCards);
    expect(hint()).toBeNull();
  });
});

describe("PlayScreen game menu", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("changes the text size from the menu, not the toolbar", async () => {
    const user = renderPlayScreen();
    expect(
      screen.queryByRole("button", { name: "Make text larger" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open game menu" }));
    const larger = screen.getByRole("button", { name: "Make text larger" });
    const smaller = screen.getByRole("button", { name: "Make text smaller" });
    expect(smaller).toHaveAttribute("aria-disabled", "true");

    await user.click(larger);
    expect(settingsStore.get().textScale).toBe(1.15);
    await user.click(smaller);
    expect(settingsStore.get().textScale).toBe(1);
  });

  it("offers game options, which set the deck up again", async () => {
    const user = renderPlayScreen();
    await user.click(screen.getByRole("button", { name: "Open game menu" }));
    const gameOptions = screen.getByRole("link", { name: "Game options" });
    expect(gameOptions).toHaveAttribute("href", "/play/a?setup=1");
    expect(gameOptions).toHaveAccessibleDescription(
      "Start the deck again with new players, level or mode"
    );
  });
});

describe("PlayScreen device integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps the screen awake while playing and lets go after", async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ released: false, release }));
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request },
    });
    const user = renderPlayScreen();
    await screen.findByText("Card 1 of 3");
    expect(request).toHaveBeenCalledWith("screen");

    await user.click(screen.getByRole("link", { name: "Back to decks" }));
    expect(await screen.findByText("Deck list")).toBeInTheDocument();
    expect(release).toHaveBeenCalled();
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  it("tints the browser chrome with the deck and restores it", async () => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#232946";
    document.head.append(meta);
    const user = renderPlayScreen();
    expect(meta.content).not.toBe("#232946");

    await user.click(screen.getByRole("link", { name: "Back to decks" }));
    expect(await screen.findByText("Deck list")).toBeInTheDocument();
    expect(meta.content).toBe("#232946");
    meta.remove();
  });
});
