import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { getDailyCard } from "../../content/dailyCard";
import { getBuiltinDeck } from "../../content/decks";
import { saveProgress } from "../../storage/progress";
import { updateSettings } from "../../storage/settings";
import HomePage from "./HomePage";

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-14T12:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("sends first-time players to the explainer", () => {
    renderHome();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(
      screen.queryByRole("link", { name: "How Unravel works" })
    ).not.toBeInTheDocument();
  });

  it("sends returning players straight to the decks", () => {
    updateSettings({ hasSeenIntro: true });
    renderHome();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/decks"
    );
    expect(
      screen.getByRole("link", { name: "How Unravel works" })
    ).toHaveAttribute("href", "/about");
  });

  it("shows the card of the day with a link to play its deck", () => {
    const { card, deck } = getDailyCard();
    renderHome();
    expect(
      screen.getByRole("region", { name: "Card of the day" })
    ).toBeInTheDocument();
    expect(screen.getByText(card.text.en)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `Play this deck: ${deck.title.en}` })
    ).toHaveAttribute("href", `/play/${deck.id}`);
  });

  it("offers to continue a game in progress", () => {
    const deck = getBuiltinDeck("unravel");
    if (!deck) throw new Error("the unravel deck is missing");
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
      updatedAt: 1,
    });
    renderHome();
    expect(screen.getByText(`Card 4 of ${order.length}`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue deck" })).toHaveAttribute(
      "href",
      "/play/unravel"
    );
    expect(
      screen.getByRole("region", { name: "Pick up where you left off" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveClass(
      "button--secondary"
    );
  });

  it("leaves the resume card out when nothing is in progress", () => {
    renderHome();
    expect(
      screen.queryByRole("link", { name: "Continue deck" })
    ).not.toBeInTheDocument();
  });

  it("leaves the resume card out when none of the saved cards are left in the deck", () => {
    saveProgress({
      deckId: "unravel",
      order: ["a-card-that-was-removed"],
      position: 0,
      hiddenCardIds: [],
      turnIndex: 0,
      options: {
        isShuffled: false,
        startLevel: 1,
        isTableMode: false,
        players: [],
      },
      startedAt: 1,
      updatedAt: 1,
    });
    renderHome();
    expect(
      screen.queryByRole("link", { name: "Continue deck" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveClass(
      "button--primary"
    );
  });

  it("credits the author in the footer", () => {
    renderHome();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      "Made with love by Tiago Costa"
    );
    expect(screen.getByRole("link", { name: "Tiago Costa" })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
  });
});
