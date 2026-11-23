import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
  useParams,
} from "react-router";
import { getDailyCard } from "../../content/dailyCard";
import { getBuiltinDeck } from "../../content/decks";
import { saveProgress } from "../../storage/progress";
import { languageSuggestionStore } from "../../storage/languageSuggestion";
import { settingsStore, updateSettings } from "../../storage/settings";
import { faqItems } from "./faq";
import { LocaleProvider } from "../../i18n/LocaleContext";
import HomePage from "./HomePage";

const PlayRouteProbe = () => <p>Playing {useParams().deckId}</p>;

const renderHome = (initialEntry = "/") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <HomePage />
    </MemoryRouter>
  );

const mockBrowserLanguage = (language: string) =>
  vi.spyOn(navigator, "language", "get").mockReturnValue(language);

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-14T12:00:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("names the page with the Unravel wordmark and the tagline", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { level: 1, name: "Unravel" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Good questions for friends, dates and partners.")
    ).toBeInTheDocument();
  });

  it("shows real cards from four decks in the hero", () => {
    renderHome();
    expect(
      screen.getByRole("img", {
        name: "Four Unravel cards from different decks, fanned out",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "What was the first thing you noticed about me when we met in person?"
      )
    ).toBeInTheDocument();
  });

  it("sends every player straight to the decks, with the explainer one link away", () => {
    renderHome();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/decks"
    );
    expect(
      screen.getByRole("link", { name: "What is Unravel?" })
    ).toHaveAttribute("href", "/about");
  });

  it("sends a player who has seen the intro to the decks as well", () => {
    updateSettings({ hasSeenIntro: true });
    renderHome();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/decks"
    );
    expect(
      screen.getByRole("link", { name: "What is Unravel?" })
    ).toBeInTheDocument();
  });

  it("puts Continue above Get started when a game is saved", () => {
    const deck = getBuiltinDeck("unravel");
    if (!deck) throw new Error("the unravel deck is missing");
    saveProgress({
      deckId: deck.id,
      order: deck.cards.map((card) => card.id),
      position: 3,
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
      updatedAt: 1,
    });
    renderHome();
    const resume = screen.getByRole("region", {
      name: "Pick up where you left off",
    });
    const continueLink = screen.getByRole("link", { name: "Continue deck" });
    const getStarted = screen.getByRole("link", { name: "Get started" });
    expect(resume).toContainElement(continueLink);
    expect(
      continueLink.compareDocumentPosition(getStarted) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      resume.compareDocumentPosition(getStarted) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(getStarted).toHaveClass("button--secondary");
  });

  it("leads with Get started when nothing is saved", () => {
    renderHome();
    expect(
      screen.queryByRole("region", { name: "Pick up where you left off" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveClass(
      "button--primary"
    );
  });

  it("offers the deck finder under the hero actions", () => {
    renderHome();
    const finder = screen.getByRole("link", {
      name: /Not sure which deck\? Find one/,
    });
    expect(finder).toHaveAttribute("href", "/finder");
    const getStarted = screen.getByRole("link", { name: "Get started" });
    expect(
      getStarted.compareDocumentPosition(finder) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
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

  it("asks before the card of the day replaces a saved game", async () => {
    const user = userEvent.setup();
    const { deck: dailyDeck } = getDailyCard();
    const savedDeck = getBuiltinDeck(
      dailyDeck.id === "unravel" ? "first-date" : "unravel"
    );
    if (!savedDeck) throw new Error("the saved deck is missing");
    saveProgress({
      deckId: savedDeck.id,
      order: savedDeck.cards.map((card) => card.id),
      position: 2,
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
      updatedAt: 1,
    });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/play/:deckId" element={<PlayRouteProbe />} />
        </Routes>
      </MemoryRouter>
    );
    await user.click(
      screen.getByRole("link", {
        name: `Play this deck: ${dailyDeck.title.en}`,
      })
    );
    const dialog = screen.getByRole("dialog", {
      name: `Replace your ${savedDeck.title.en} game?`,
    });
    expect(
      within(dialog).getByText(
        `You are on card 3 of ${savedDeck.cards.length}.`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`Playing ${dailyDeck.id}`)
    ).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: `Start ${dailyDeck.title.en}`,
      })
    );
    expect(screen.getByText(`Playing ${dailyDeck.id}`)).toBeInTheDocument();
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
        isRandomTurns: false,
        isPassThePhone: false,
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
        isRandomTurns: false,
        isPassThePhone: false,
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

  it("anchors the card of the day for the /#today shortcut", () => {
    renderHome("/#today");
    expect(
      screen.getByRole("region", { name: "Card of the day" })
    ).toHaveAttribute("id", "today");
  });

  it("gives the tab the full title with the tagline", () => {
    renderHome();
    expect(document.title).toBe(
      "Unravel · Good questions for friends, dates and partners"
    );
  });

  it("scrolls to the card of the day on /#today, again on a repeat while already home", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      const router = createMemoryRouter(
        [{ path: "/", element: <HomePage /> }],
        {
          initialEntries: ["/"],
        }
      );
      render(<RouterProvider router={router} />);
      expect(scrollIntoView).not.toHaveBeenCalled();

      // A tapped reminder navigates while Home is already open.
      await act(() => router.navigate("/#today"));
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
      expect(scrollIntoView.mock.contexts[0]).toHaveProperty("id", "today");

      await act(() => router.navigate("/#today"));
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(2));
    } finally {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
  });

  it("explains how it works, links a few decks and answers common questions", () => {
    renderHome();
    const steps = screen.getByRole("region", { name: "How it works" });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(3);

    const shelf = screen.getByRole("region", { name: "Start with a deck" });
    expect(
      within(shelf).getByRole("link", { name: "See all decks" })
    ).toHaveAttribute("href", "/decks");
    expect(
      within(shelf).getByRole("link", { name: /^First Date/ })
    ).toHaveAttribute("href", "/decks/first-date");
    expect(
      within(shelf).queryByRole("link", { name: /Flames of Desire/ })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("img", {
        name: "QR code that opens unravel.tiagocostadev.com",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "What you say stays at the table" })
    ).toHaveTextContent("No tracking");

    const faq = screen.getByRole("region", {
      name: "Questions before you play",
    });
    expect(within(faq).getAllByText(/\?$/)).toHaveLength(faqItems.length);
  });

  it("links the main pages and credits the author in the footer", () => {
    renderHome();
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Made with love by Tiago Costa");
    expect(footer).toHaveTextContent("Everything stays on your device.");
    for (const [name, href] of [
      ["Decks", "/decks"],
      ["Find a deck", "/finder"],
      ["Create a deck", "/custom/new"],
      ["About", "/about"],
    ]) {
      expect(within(footer).getByRole("link", { name })).toHaveAttribute(
        "href",
        href
      );
    }
    expect(screen.getByRole("link", { name: "Tiago Costa" })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
  });

  describe("seasonal strip", () => {
    it("shows decks in season now", () => {
      vi.setSystemTime(new Date("2026-11-23T12:00:00"));
      renderHome();
      const strip = screen.getByRole("region", { name: "In season now" });
      expect(
        within(strip).getByRole("link", { name: "Halloween" })
      ).toHaveAttribute("href", "/decks/halloween");
    });

    it("shows the next seasonal deck and its start date when nothing is in season", () => {
      vi.setSystemTime(new Date("2027-01-20T12:00:00"));
      renderHome();
      expect(
        screen.getByRole("link", {
          name: "Coming up: Valentine's Day, from 1 Feb",
        })
      ).toHaveAttribute("href", "/decks/valentines");
    });
  });

  it("names the coming-up deck with a spelled-out month in Portuguese", () => {
    vi.setSystemTime(new Date("2027-01-20T12:00:00"));
    render(
      <MemoryRouter>
        <LocaleProvider locale="pt">
          <HomePage />
        </LocaleProvider>
      </MemoryRouter>
    );
    expect(
      screen.getByRole("link", {
        name: "Em breve: Dia dos Namorados, a partir de 1 de fevereiro",
      })
    ).toHaveAttribute("href", "/decks/valentines");
  });

  describe("language suggestion", () => {
    it("offers Portuguese once to a Portuguese browser and switches on request", async () => {
      mockBrowserLanguage("pt-PT");
      const user = userEvent.setup();
      renderHome();
      await user.click(
        screen.getByRole("button", { name: "Mudar para português" })
      );
      expect(settingsStore.get().locale).toBe("pt");
      expect(languageSuggestionStore.get()).toBe(true);
      expect(screen.queryByText("Jogar em português?")).not.toBeInTheDocument();
    });

    it("stays away for good once dismissed, and English stays on", async () => {
      mockBrowserLanguage("pt-BR");
      const user = userEvent.setup();
      const { unmount } = renderHome();
      await user.click(
        screen.getByRole("button", { name: "Continuar em inglês" })
      );
      expect(settingsStore.get().locale).toBe("en");
      unmount();
      renderHome();
      expect(screen.queryByText("Jogar em português?")).not.toBeInTheDocument();
    });

    it("never shows for other browser languages", () => {
      mockBrowserLanguage("en-GB");
      renderHome();
      expect(screen.queryByText("Jogar em português?")).not.toBeInTheDocument();
    });
  });
});
