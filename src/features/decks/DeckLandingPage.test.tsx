import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { confirmAge } from "../../storage/ageGate";
import DeckLandingPage from "./DeckLandingPage";

const PlayRouteProbe = () => {
  const { deckId } = useParams();
  return <p>Playing {deckId}</p>;
};

const renderLanding = (deckId: string) =>
  render(
    <MemoryRouter initialEntries={[`/decks/${deckId}`]}>
      <Routes>
        <Route path="/decks/:deckId" element={<DeckLandingPage />} />
        <Route path="/play/:deckId" element={<PlayRouteProbe />} />
      </Routes>
    </MemoryRouter>
  );

describe("DeckLandingPage", () => {
  beforeEach(() => localStorage.clear());

  it("shows the deck title, five sample cards and the tab title", () => {
    renderLanding("first-date");
    expect(
      screen.getByRole("heading", { level: 1, name: "First Date" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(document.title).toBe("First Date · Unravel");
    expect(
      screen.getByRole("link", { name: "Browse all decks" })
    ).toHaveAttribute("href", "/decks");
  });

  it("renders the not-found page for an unknown deck", () => {
    renderLanding("no-such-deck");
    expect(
      screen.getByRole("heading", { name: "This page wandered off" })
    ).toBeInTheDocument();
  });

  it("keeps adult sample cards hidden until age is confirmed", () => {
    renderLanding("flames-of-desire");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Confirm age to see samples" })
    ).toBeInTheDocument();
  });

  it("shows adult sample cards after age is confirmed", () => {
    confirmAge();
    renderLanding("flames-of-desire");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("asks for age before starting an adult deck", async () => {
    const user = userEvent.setup();
    renderLanding("flames-of-desire");
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    await user.click(
      screen.getByRole("button", { name: "Confirm I'm 18 or older" })
    );
    expect(screen.getByText("Playing flames-of-desire")).toBeInTheDocument();
  });

  describe("seasonal decks", () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
    afterEach(() => vi.useRealTimers());

    it("explains the season when the link is opened out of season", () => {
      vi.setSystemTime(new Date("2026-11-14T12:00:00"));
      renderLanding("pride");
      expect(screen.getByText(/In season 1 to 30 June\./)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Start deck" })
      ).toBeInTheDocument();
    });

    it("drops the season line during the season", () => {
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));
      renderLanding("pride");
      expect(screen.queryByText(/In season/)).not.toBeInTheDocument();
    });
  });
});
