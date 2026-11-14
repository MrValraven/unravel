import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { getBuiltinDeck } from "../../content/decks";
import { confirmAge } from "../../storage/ageGate";
import { toggleFavourite } from "../../storage/favourites";
import { saveProgress } from "../../storage/progress";
import DeckPickerPage from "./DeckPickerPage";

const PlayRouteProbe = () => {
  const { deckId } = useParams();
  return <p>Playing {deckId}</p>;
};

const renderPicker = () =>
  render(
    <MemoryRouter initialEntries={["/decks"]}>
      <Routes>
        <Route path="/decks" element={<DeckPickerPage />} />
        <Route path="/play/:deckId" element={<PlayRouteProbe />} />
      </Routes>
    </MemoryRouter>
  );

const requireDeck = (deckId: string) => {
  const deck = getBuiltinDeck(deckId);
  if (!deck) throw new Error(`Missing live deck ${deckId}`);
  return deck;
};

describe("DeckPickerPage sections", () => {
  beforeEach(() => localStorage.clear());

  it("shows a section per deck category and the finder entry", () => {
    renderPicker();
    expect(
      screen.getByRole("heading", { name: "Make Friends & Socialize" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dating & Romance" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Adults · 18+" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Not sure\? Find a deck/ })
    ).toHaveAttribute("href", "/finder");
  });

  it("lists every deck of a category inside its section", () => {
    renderPicker();
    const datingSection = screen.getByRole("region", {
      name: "Dating & Romance",
    });
    expect(
      within(datingSection).getByRole("button", { name: "First Date" })
    ).toBeInTheDocument();
    expect(
      within(datingSection).queryByRole("button", { name: "Unravel" })
    ).not.toBeInTheDocument();
  });

  it("marks adult decks with the 18+ label", () => {
    renderPicker();
    expect(
      screen.getByRole("button", { name: "Flames of Desire" })
    ).toHaveAccessibleDescription(/For adults only/);
  });

  it("counts the stars still needed for the favourites deck", () => {
    toggleFavourite(requireDeck("unravel").cards[0]?.id ?? "");
    renderPicker();
    const yourDecks = screen.getByRole("region", { name: "Your decks" });
    expect(yourDecks).toHaveTextContent("Star 4 more cards");
    expect(
      within(yourDecks).getByRole("link", { name: "Create a deck" })
    ).toHaveAttribute("href", "/custom/new");
  });

  it("shows the favourites deck once five cards are starred", () => {
    for (const card of requireDeck("unravel").cards.slice(0, 5))
      toggleFavourite(card.id);
    renderPicker();
    const yourDecks = screen.getByRole("region", { name: "Your decks" });
    expect(
      within(yourDecks).getByRole("button", { name: "Your favourites" })
    ).toBeInTheDocument();
    expect(yourDecks).not.toHaveTextContent("more cards");
  });

  it("offers to continue the saved game", () => {
    const deck = requireDeck("first-date");
    const order = deck.cards.map((card) => card.id);
    saveProgress({
      deckId: deck.id,
      order,
      position: 3,
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
    renderPicker();
    expect(screen.getByText(`Card 4 of ${order.length}`)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Pick up where you left off" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue deck" })).toHaveAttribute(
      "href",
      "/play/first-date"
    );
  });
});

describe("DeckPickerPage preview", () => {
  beforeEach(() => localStorage.clear());

  it("opens a preview with three sample cards and the deck page link", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "First Date" }));
    const preview = screen.getByRole("dialog", { name: "First Date" });
    expect(within(preview).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(preview).getByRole("link", { name: "Open deck page" })
    ).toHaveAttribute("href", "/decks/first-date");
  });

  it("starts a deck straight away when it is for everyone", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "First Date" }));
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    expect(screen.getByText("Playing first-date")).toBeInTheDocument();
  });

  it("hides adult sample cards until age is confirmed", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Flames of Desire" }));
    const preview = screen.getByRole("dialog", { name: "Flames of Desire" });
    expect(within(preview).queryAllByRole("listitem")).toHaveLength(0);
    expect(
      within(preview).getByRole("button", {
        name: "Confirm age to see samples",
      })
    ).toBeInTheDocument();
  });

  it("shows adult sample cards when age was confirmed earlier", async () => {
    confirmAge();
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Flames of Desire" }));
    const preview = screen.getByRole("dialog", { name: "Flames of Desire" });
    expect(within(preview).getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("DeckPickerPage age gate", () => {
  beforeEach(() => localStorage.clear());

  it("asks for age before starting an adult deck, then opens it", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Flames of Desire" }));
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    const ageGate = screen.getByRole("dialog", { name: "Adult content ahead" });
    expect(
      screen.queryByText("Playing flames-of-desire")
    ).not.toBeInTheDocument();
    await user.click(
      within(ageGate).getByRole("button", { name: "Confirm I'm 18 or older" })
    );
    expect(screen.getByText("Playing flames-of-desire")).toBeInTheDocument();
  });

  it("stays on the preview when the age gate is cancelled", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Flames of Desire" }));
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    const ageGate = screen.getByRole("dialog", { name: "Adult content ahead" });
    await user.click(within(ageGate).getByRole("button", { name: "Go back" }));
    expect(
      screen.queryByText("Playing flames-of-desire")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Flames of Desire" })
    ).toBeInTheDocument();
  });
});

describe("DeckPickerPage seasonal decks", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
  });
  afterEach(() => vi.useRealTimers());

  it("leaves a seasonal deck out of the list outside its season", () => {
    vi.setSystemTime(new Date("2026-11-14T12:00:00"));
    renderPicker();
    expect(
      screen.queryByRole("button", { name: "Pride Month" })
    ).not.toBeInTheDocument();
  });

  it("lists a seasonal deck with its Seasonal tag during its season", () => {
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));
    renderPicker();
    expect(
      screen.getByRole("button", { name: "Pride Month" })
    ).toHaveAccessibleDescription(/Seasonal/);
  });
});
