import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  cards: Card[] = threeCards,
  startedAt = 0
) => {
  const deck = { ...makeDeck(cards), ...deckPatch };
  // Unshuffled, so the only random draw is the two player starter: 0 picks player 1.
  const session = createSession(
    deck,
    makeOptions(optionsPatch),
    startedAt,
    () => 0
  );
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

describe("PlayScreen vote and hot-seat cards", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, "vibrate");
  });

  const voteCards = [
    makeCard("first-date-001", 1, "vote"),
    makeCard("first-date-002", 1, "question"),
  ];
  const hotSeatCard: Card = {
    ...makeCard("first-date-001", 1, "hot-seat"),
    timerSeconds: 60,
  };

  it("counts down to Point! on a vote card", () => {
    // user-event waits on real timers, so this test clicks with fireEvent.
    vi.useFakeTimers();
    const vibrate = vi.fn((_pattern: VibratePattern) => true);
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    });
    renderPlayScreen({}, {}, voteCards);
    expect(screen.getByText("Everyone votes")).toBeInTheDocument();

    const pointButton = screen.getByRole("button", { name: "Point on 3" });
    pointButton.focus();
    fireEvent.click(pointButton);
    const live = document.querySelector(".vote-countdown__live");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveTextContent("3");
    // The same button stays in place through the count, so focus never drops to the page.
    expect(pointButton).toBeInTheDocument();
    expect(pointButton).toHaveFocus();
    expect(pointButton).toHaveAttribute("aria-disabled", "true");
    expect(pointButton).toHaveTextContent("3");

    act(() => vi.advanceTimersByTime(1000));
    expect(live).toHaveTextContent("2");
    expect(pointButton).toHaveFocus();
    act(() => vi.advanceTimersByTime(1000));
    expect(live).toHaveTextContent("1");
    const callsBeforePoint = vibrate.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(live).toHaveTextContent("Point!");
    expect(pointButton).toHaveTextContent("Point!");
    expect(pointButton).toHaveFocus();
    expect(vibrate.mock.calls.length).toBe(callsBeforePoint + 1);

    // Pressing it mid-count does not start a second count.
    fireEvent.click(pointButton);
    expect(live).toHaveTextContent("Point!");

    act(() => vi.advanceTimersByTime(1500));
    expect(live).toHaveTextContent("");
    expect(screen.getByRole("button", { name: "Point on 3" })).toBe(
      pointButton
    );
    expect(pointButton).toHaveFocus();
    expect(pointButton).not.toHaveAttribute("aria-disabled");
  });

  it("names the hot-seat player in the turn line and offers its timer", () => {
    renderPlayScreen({}, { players: ["Ana", "Rui", "Eva"] }, [hotSeatCard]);
    expect(screen.getByText("Ana is in the hot seat")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start timer" })
    ).toBeInTheDocument();
  });

  it("shows no timer on a vote card", () => {
    renderPlayScreen({}, {}, [{ ...voteCards[0]!, timerSeconds: 60 }]);
    expect(
      screen.queryByRole("button", { name: "Start timer" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Point on 3" })
    ).toBeInTheDocument();
  });

  it("shows no countdown button on other card types", () => {
    renderPlayScreen();
    expect(
      screen.queryByRole("button", { name: "Point on 3" })
    ).not.toBeInTheDocument();
  });
});

describe("PlayScreen pass-the-phone", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const group = { players: ["Ana", "Rui", "Eva"], isPassThePhone: true };
  // Revealed cards are remembered per game for the whole page session, so each test plays its own game.
  let gameStartedAt = 10_000;
  const renderPassThePhone = (
    cards: Card[] = threeCards,
    optionsPatch: Partial<PlayOptions> = {}
  ) => {
    gameStartedAt += 1;
    return renderPlayScreen(
      {},
      { ...group, ...optionsPatch },
      cards,
      gameStartedAt
    );
  };
  const cardRegion = () => screen.getByRole("group", { name: "Current card" });
  const announcement = () =>
    document.querySelector(".card-stage [aria-live='polite']");
  const underlay = () => document.querySelector(".card-stage__underlay");
  const touch = { pointerId: 1, isPrimary: true, pointerType: "touch" };
  const holdDrag = (fromX: number, toX: number) => {
    fireEvent.pointerDown(cardRegion(), {
      ...touch,
      clientX: fromX,
      clientY: 200,
    });
    fireEvent.pointerMove(cardRegion(), {
      ...touch,
      clientX: toX,
      clientY: 200,
    });
  };

  it("covers the card until the named player reveals it", async () => {
    const user = renderPassThePhone();
    expect(screen.getByText("Pass the phone to Ana")).toBeInTheDocument();
    // The button says what it does, and screen readers hear those same words.
    expect(
      screen.getByRole("button", { name: "Reveal card" })
    ).toHaveTextContent(/^Reveal card$/);
    expect(document.body).not.toHaveTextContent("first-date-001");
    expect(screen.queryByText("Ana's turn")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reveal card" }));
    expect(
      screen.getByText("first-date-001", { selector: ".play-card__text" })
    ).toBeInTheDocument();
    expect(screen.getByText("Ana's turn")).toBeInTheDocument();
    expect(screen.queryByText(/asks/)).not.toBeInTheDocument();
    expect(screen.queryByText("Pass the phone to Ana")).not.toBeInTheDocument();
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    // The button left with the cover, so focus lands on the card itself.
    expect(cardRegion()).toHaveFocus();
  });

  it("reads the card, not the cover, when focus lands on it after a reveal", async () => {
    const user = renderPassThePhone();
    // A screen reader reads the description at the moment focus arrives.
    const descriptionsOnFocus: string[] = [];
    cardRegion().addEventListener("focus", () => {
      const describedBy = cardRegion().getAttribute("aria-describedby") ?? "";
      descriptionsOnFocus.push(
        document.getElementById(describedBy)?.textContent ?? ""
      );
    });

    await user.click(screen.getByRole("button", { name: "Reveal card" }));
    expect(cardRegion()).toHaveFocus();
    expect(descriptionsOnFocus).toEqual([
      "Card 1 of 3. Ana's turn. first-date-001",
    ]);
    expect(cardRegion()).toHaveAccessibleDescription(
      "Card 1 of 3. Ana's turn. first-date-001"
    );
  });

  it("reveals a covered card on a tap anywhere on it and never skips it", () => {
    renderPassThePhone();
    // A tap on the right third would turn an open card; a covered one opens instead.
    fireEvent.pointerDown(cardRegion(), { ...touch, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(cardRegion(), { ...touch, clientX: 300, clientY: 200 });
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("first-date-001", { selector: ".play-card__text" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Pass the phone to Ana")).not.toBeInTheDocument();
    expect(cardRegion()).toHaveFocus();

    // Open now, the same tap turns the card as usual and the next one comes covered.
    fireEvent.pointerDown(cardRegion(), { ...touch, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(cardRegion(), { ...touch, clientX: 300, clientY: 200 });
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Pass the phone to Rui")).toBeInTheDocument();

    // A tap on the left of a covered card reveals it too.
    fireEvent.pointerDown(cardRegion(), { ...touch, clientX: -50, clientY: 200 });
    fireEvent.pointerUp(cardRegion(), { ...touch, clientX: -50, clientY: 200 });
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("first-date-002", { selector: ".play-card__text" })
    ).toBeInTheDocument();
  });

  it("still turns a covered card with Next", async () => {
    const user = renderPassThePhone();
    await user.click(nextButton());
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Pass the phone to Rui")).toBeInTheDocument();
  });

  it("reveals from the keyboard and still moves on from a covered card", async () => {
    const user = renderPassThePhone();
    screen.getByRole("button", { name: "Reveal card" }).focus();
    await user.keyboard(" ");
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("first-date-001", { selector: ".play-card__text" })
    ).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Pass the phone to Rui")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Card 3 of 3")).toBeInTheDocument();
  });

  it("announces the cover first, then the card", async () => {
    const user = renderPassThePhone();
    expect(announcement()).toHaveTextContent(
      /^Card 1 of 3\. Pass the phone to Ana\. Reveal card$/
    );
    expect(cardRegion()).toHaveAccessibleDescription(
      "Card 1 of 3. Pass the phone to Ana. Reveal card"
    );

    await user.click(screen.getByRole("button", { name: "Reveal card" }));
    expect(announcement()).toHaveTextContent(
      /^Card 1 of 3\. Ana's turn\. first-date-001$/
    );
  });

  it("keeps the covered text out of the drag preview, the share button and the announcement", async () => {
    const user = renderPassThePhone();
    expect(
      screen.queryByRole("button", { name: "Share card" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save card to favourites" })
    ).not.toBeInTheDocument();
    expect(announcement()).not.toHaveTextContent("first-date-001");

    await user.click(screen.getByRole("button", { name: "Reveal card" }));
    expect(
      screen.getByRole("button", { name: "Share card" })
    ).toBeInTheDocument();

    // The next card waits under this one covered, with its own player's name.
    holdDrag(100, 160);
    expect(underlay()).not.toBeNull();
    expect(underlay()).toHaveTextContent("Pass the phone to Rui");
    expect(underlay()).not.toHaveTextContent("first-date-002");
    expect(document.body).not.toHaveTextContent("first-date-002");
    expect(underlay()?.querySelector("button")).toBeNull();
  });

  it("keeps the covered text off the turned table-mode copy", () => {
    // Setup never allows both, but a covered card must stay covered on both faces if a save has them.
    renderPassThePhone(threeCards, { isTableMode: true });
    expect(document.body).not.toHaveTextContent("first-date-001");
    const turnedCover = screen
      .getAllByText("Pass the phone to Ana")[0]
      ?.closest(".play-card__face--across");
    expect(turnedCover).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("button", { name: "Reveal card" })).toHaveLength(
      1
    );
  });

  it("shows a revealed card open again after Previous", async () => {
    const user = renderPassThePhone();
    await user.click(screen.getByRole("button", { name: "Reveal card" }));
    await user.click(nextButton());
    expect(screen.getByText("Pass the phone to Rui")).toBeInTheDocument();

    // Dragging back shows the card Ana already revealed, still open.
    holdDrag(300, 240);
    expect(underlay()).toHaveTextContent("first-date-001");
    fireEvent.pointerUp(cardRegion(), { ...touch, clientX: 240, clientY: 200 });

    await user.click(screen.getByRole("button", { name: "Previous card" }));
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("first-date-001", { selector: ".play-card__text" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reveal card" })
    ).not.toBeInTheDocument();

    await user.click(nextButton());
    expect(screen.getByText("Pass the phone to Rui")).toBeInTheDocument();
  });

  it("covers a skipped card again when it comes back to another player", async () => {
    const user = renderPassThePhone([
      makeCard("first-date-001", 1),
      makeCard("first-date-002", 1),
      makeCard("first-date-003", 1),
    ]);
    await user.click(screen.getByRole("button", { name: "Reveal card" }));
    expect(
      screen.getByText("first-date-001", { selector: ".play-card__text" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Skip for now" }));
    await user.click(nextButton());
    await user.click(nextButton());
    expect(screen.getByText("Card 3 of 3")).toBeInTheDocument();
    // Ana read it before it was skipped; now it is Eva's card, so it is covered again.
    expect(screen.getByText("Pass the phone to Eva")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("first-date-001");
  });

  it("shows a revealed card open again when the game resumes in the app", async () => {
    const deck = makeDeck(threeCards);
    const session = createSession(deck, makeOptions(group), 777, () => 0);
    const renderGame = () =>
      render(
        <MemoryRouter initialEntries={[`/play/${deck.id}`]}>
          <Routes>
            <Route
              path="/play/:deckId"
              element={<PlayScreen deck={deck} initialSession={session} />}
            />
          </Routes>
        </MemoryRouter>
      );
    const first = renderGame();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reveal card" }));
    first.unmount();

    renderGame();
    expect(
      screen.getByText("first-date-001", { selector: ".play-card__text" })
    ).toBeInTheDocument();
  });

  it("never covers vote or everyone cards", async () => {
    const user = renderPassThePhone([
      makeCard("first-date-001", 1, "vote"),
      makeCard("first-date-002", 1, "everyone"),
      { ...makeCard("first-date-003", 1, "hot-seat"), timerSeconds: 60 },
    ]);
    expect(screen.queryByText(/Pass the phone/)).not.toBeInTheDocument();
    expect(
      screen.getByText("first-date-001", { selector: ".play-card__text" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Point on 3" })
    ).toBeInTheDocument();

    await user.click(nextButton());
    expect(screen.queryByText(/Pass the phone/)).not.toBeInTheDocument();
    expect(
      screen.getByText("first-date-002", { selector: ".play-card__text" })
    ).toBeInTheDocument();

    // Hot seat is one named player's card, so it is covered, timer and all.
    await user.click(nextButton());
    expect(screen.getByText(/^Pass the phone to /)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start timer" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reveal card" }));
    expect(screen.getByText(/is in the hot seat$/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start timer" })
    ).toBeInTheDocument();
  });
});
