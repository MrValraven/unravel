import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { getBuiltinDeck } from "../../content/decks";
import { confirmAge } from "../../storage/ageGate";
import { loadProgress, saveProgress } from "../../storage/progress";
import DeckLandingPage from "./DeckLandingPage";

const PlayRouteProbe = () => {
  const { deckId } = useParams();
  return <p>Playing {deckId}</p>;
};

const saveBuiltinGame = (deckId: string, position: number) => {
  const deck = getBuiltinDeck(deckId);
  if (!deck) throw new Error(`Missing live deck ${deckId}`);
  saveProgress({
    deckId,
    order: deck.cards.map((card) => card.id),
    position,
    hiddenCardIds: [],
    turnIndex: 0,
    options: {
      isShuffled: false,
      startLevel: 1,
      isTableMode: false,
      isRandomTurns: false,
      isPassThePhone: false,
      players: [],
    },
    startedAt: 1,
    updatedAt: 2,
  });
  return deck.cards.length;
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

const stubShare = (share: (data: ShareData) => Promise<void>) =>
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });

describe("DeckLandingPage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    Reflect.deleteProperty(navigator, "share");
    vi.restoreAllMocks();
  });

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

  it("asks before Start replaces a saved game of another deck, and Keep stays on the page", async () => {
    const user = userEvent.setup();
    const cardCount = saveBuiltinGame("unravel", 4);
    renderLanding("first-date");
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    const dialog = screen.getByRole("dialog", {
      name: "Replace your Unravel game?",
    });
    expect(
      within(dialog).getByText(`You are on card 5 of ${cardCount}.`)
    ).toBeInTheDocument();
    expect(screen.queryByText("Playing first-date")).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Keep Unravel" })
    );
    expect(screen.queryByText("Playing first-date")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "First Date" })
    ).toBeInTheDocument();
    expect(loadProgress()?.deckId).toBe("unravel");
  });

  it("starts the new deck when Start is chosen in the dialog", async () => {
    const user = userEvent.setup();
    saveBuiltinGame("unravel", 4);
    renderLanding("first-date");
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    await user.click(screen.getByRole("button", { name: "Start First Date" }));
    expect(screen.getByText("Playing first-date")).toBeInTheDocument();
  });

  it("starts without asking when the saved game is this deck", async () => {
    const user = userEvent.setup();
    saveBuiltinGame("first-date", 4);
    renderLanding("first-date");
    await user.click(screen.getByRole("button", { name: "Start deck" }));
    expect(screen.getByText("Playing first-date")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shares the deck page link with its title", async () => {
    const user = userEvent.setup();
    const share = vi.fn((data: ShareData) => {
      void data;
      return Promise.resolve();
    });
    stubShare(share);
    renderLanding("flames-of-desire");
    await user.click(screen.getByRole("button", { name: "Share deck" }));
    expect(share).toHaveBeenCalledWith({
      title: "Flames of Desire",
      text: "Flames of Desire, a conversation deck on Unravel",
      url: `${window.location.origin}/decks/flames-of-desire`,
    });
  });

  it("copies the link and says so without a share sheet", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    renderLanding("first-date");
    await user.click(screen.getByRole("button", { name: "Share deck" }));
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/decks/first-date`
    );
    expect(screen.getByRole("status")).toHaveTextContent("Link copied");
  });

  it("shows the link in a field when sharing and copying both fail", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("blocked")
    );
    renderLanding("first-date");
    await user.click(screen.getByRole("button", { name: "Share deck" }));
    expect(
      screen.getByRole("dialog", { name: "Copy this link" })
    ).toBeVisible();
    expect(screen.getByLabelText("Link")).toHaveValue(
      `${window.location.origin}/decks/first-date`
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("ignores a second tap on Share while the share sheet is still open", async () => {
    const user = userEvent.setup();
    let closeSheet = () => {};
    const share = vi.fn((data: ShareData) => {
      void data;
      // The first sheet stays open; a second call is refused, as browsers do.
      if (share.mock.calls.length > 1)
        return Promise.reject(new DOMException("busy", "InvalidStateError"));
      return new Promise<void>((resolve) => {
        closeSheet = resolve;
      });
    });
    stubShare(share);
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    renderLanding("first-date");
    const shareButton = screen.getByRole("button", { name: "Share deck" });
    await user.click(shareButton);
    await user.click(shareButton);
    expect(share).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await act(async () => closeSheet());
    share.mockClear();
    share.mockResolvedValue(undefined);
    await user.click(shareButton);
    expect(share).toHaveBeenCalledTimes(1);
  });

  it("says nothing when the share sheet is closed", async () => {
    const user = userEvent.setup();
    stubShare(() => Promise.reject(new DOMException("closed", "AbortError")));
    renderLanding("first-date");
    await user.click(screen.getByRole("button", { name: "Share deck" }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
