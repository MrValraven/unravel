import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { confirmAge } from "../../storage/ageGate";
import DeckLandingPage from "./DeckLandingPage";

const PlayRouteProbe = () => {
  const { deckId } = useParams();
  return <p>Playing {deckId}</p>;
};

const getSamples = () =>
  within(screen.getByRole("region", { name: "A taste of the deck" }));

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
    expect(getSamples().getAllByRole("listitem")).toHaveLength(5);
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
    expect(getSamples().queryAllByRole("listitem")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Confirm age to see samples" })
    ).toBeInTheDocument();
  });

  it("shows adult sample cards after age is confirmed", () => {
    confirmAge();
    renderLanding("flames-of-desire");
    expect(getSamples().getAllByRole("listitem")).toHaveLength(5);
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

  it("shows breadcrumbs from the deck list through the category to the deck", () => {
    renderLanding("first-date");
    const breadcrumbs = within(
      screen.getByRole("navigation", { name: "Breadcrumb" })
    );
    expect(breadcrumbs.getByRole("link", { name: "Decks" })).toHaveAttribute(
      "href",
      "/decks"
    );
    expect(
      breadcrumbs.getByRole("link", { name: "Dating & Romance" })
    ).toHaveAttribute("href", "/decks#decks-dating");
    expect(breadcrumbs.getByText("First Date")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("links related decks to their own pages and keeps 18+ decks out", () => {
    renderLanding("first-date");
    const related = within(
      screen.getByRole("region", { name: "Related decks" })
    );
    const links = related.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(4);
    expect(related.getByRole("link", { name: "Date Night" })).toHaveAttribute(
      "href",
      "/decks/date-night"
    );
    expect(
      related.queryByRole("link", { name: "First Date" })
    ).not.toBeInTheDocument();
    expect(
      related.queryByRole("link", { name: "Flames of Desire" })
    ).not.toBeInTheDocument();
  });

  it("keeps the canonical link and og:url on the deck's own address", () => {
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = "https://unravel.tiagocostadev.com";
    const ogUrl = document.createElement("meta");
    ogUrl.setAttribute("property", "og:url");
    ogUrl.content = "https://unravel.tiagocostadev.com";
    document.head.append(canonical, ogUrl);
    try {
      renderLanding("first-date");
      expect(canonical.getAttribute("href")).toBe(
        "https://unravel.tiagocostadev.com/decks/first-date"
      );
      expect(ogUrl.getAttribute("content")).toBe(
        "https://unravel.tiagocostadev.com/decks/first-date"
      );
    } finally {
      canonical.remove();
      ogUrl.remove();
    }
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
