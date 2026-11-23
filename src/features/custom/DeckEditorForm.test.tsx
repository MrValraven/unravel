import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { customDecksStore, listCustomDecks } from "../../storage/customDecks";
import {
  NEW_DECK_DRAFT_KEY,
  clearCustomDeckDraft,
  loadCustomDeckDraft,
  saveCustomDeckDraft,
} from "../../storage/customDeckDraft";
import CustomDeckEditorPage from "./CustomDeckEditorPage";

/** `history` lists the pages visited before the editor, so browser Back has somewhere to go. */
const renderEditor = async (
  initialPath = "/custom/new",
  history: string[] = []
) => {
  const router = createMemoryRouter(
    [
      { path: "/custom/new", element: <CustomDeckEditorPage /> },
      { path: "/custom/:customId/edit", element: <CustomDeckEditorPage /> },
      { path: "/custom", element: <p>Your decks list</p> },
      { path: "/elsewhere", element: <p>Somewhere else</p> },
    ],
    {
      initialEntries: [...history, initialPath],
      initialIndex: history.length,
    }
  );
  let unmount!: () => void;
  await act(async () => {
    ({ unmount } = render(<RouterProvider router={router} />));
  });
  return { router, unmount };
};

/**
 * Starts an in-app navigation the way a player's Back or link press does. The discard dialog
 * takes focus from the field being edited, so the field is blurred inside act first: its
 * blur handler would otherwise run while React flushes the dialog's effects, outside act.
 */
const navigateAway = async (
  router: ReturnType<typeof createMemoryRouter>,
  to: string | number
) => {
  await act(async () => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    if (typeof to === "number") await router.navigate(to);
    else await router.navigate(to);
  });
};

const discardDialogTitle = "Discard your changes?";
const restoreDialogTitle = "Restore your unsaved changes?";

const blockStorageWrites = () =>
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("full", "QuotaExceededError");
  });

const fillDeck = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Deck title"), "Road trip");
  await user.type(
    screen.getByRole("textbox", { name: /^Card 1/ }),
    "Where should we go next?"
  );
};

describe("DeckEditorForm saving", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCustomDeckDraft();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    // A blocked save leaves its deck in the store's memory; clear it for the next test.
    customDecksStore.set([]);
  });

  it("saves a deck and returns to the list", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    await fillDeck(user);
    await user.click(screen.getByRole("button", { name: "Save deck" }));
    expect(await screen.findByText("Your decks list")).toBeVisible();
    expect(screen.queryByText(discardDialogTitle)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/custom");
    expect(listCustomDecks()).toHaveLength(1);
  });

  it("names the cause and stays on the editor when the browser blocks saving", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    await fillDeck(user);
    blockStorageWrites();
    await user.click(screen.getByRole("button", { name: "Save deck" }));
    expect(
      await screen.findByText(
        /Your browser blocked saving: storage is full or turned off/
      )
    ).toBeVisible();
    expect(router.state.location.pathname).toBe("/custom/new");
  });

  it("saving again after a block keeps one deck, not two", async () => {
    const user = userEvent.setup();
    await renderEditor();
    await fillDeck(user);
    blockStorageWrites();
    await user.click(screen.getByRole("button", { name: "Save deck" }));
    await user.click(screen.getByRole("button", { name: "Save deck" }));
    expect(listCustomDecks()).toHaveLength(1);
  });
});

describe("DeckEditorForm leaving", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCustomDeckDraft();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    customDecksStore.set([]);
  });

  it("asks before browser Back drops unsaved edits, and Keep editing keeps them", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor("/custom/new", ["/custom"]);
    await fillDeck(user);
    await navigateAway(router, -1);
    expect(await screen.findByText(discardDialogTitle)).toBeVisible();
    expect(router.state.location.pathname).toBe("/custom/new");
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    await waitFor(() =>
      expect(screen.queryByText(discardDialogTitle)).not.toBeInTheDocument()
    );
    expect(router.state.location.pathname).toBe("/custom/new");
    expect(screen.getByLabelText("Deck title")).toHaveValue("Road trip");
  });

  it("Discard leaves for the page that was asked for, on the first try", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    await fillDeck(user);
    await navigateAway(router, "/elsewhere");
    expect(await screen.findByText(discardDialogTitle)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByText("Somewhere else")).toBeVisible();
    expect(router.state.location.pathname).toBe("/elsewhere");
    expect(screen.queryByText(discardDialogTitle)).not.toBeInTheDocument();
  });

  it("Cancel with edits asks, and Discard then leaves for the decks list", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    await fillDeck(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByText(discardDialogTitle)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByText("Your decks list")).toBeVisible();
    expect(router.state.location.pathname).toBe("/custom");
  });

  it("leaves without asking when nothing changed", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByText("Your decks list")).toBeVisible();
    expect(screen.queryByText(discardDialogTitle)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/custom");
  });

  it("saves and leaves without asking", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor("/custom/new", ["/custom"]);
    await fillDeck(user);
    await user.click(screen.getByRole("button", { name: "Save deck" }));
    expect(await screen.findByText("Your decks list")).toBeVisible();
    expect(screen.queryByText(discardDialogTitle)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/custom");
    expect(listCustomDecks()).toHaveLength(1);
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
  });

  it("still asks when a save was blocked, because nothing was kept", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    await fillDeck(user);
    blockStorageWrites();
    await user.click(screen.getByRole("button", { name: "Save deck" }));
    await screen.findByText(/Your browser blocked saving/);
    await navigateAway(router, "/elsewhere");
    expect(await screen.findByText(discardDialogTitle)).toBeVisible();
    expect(router.state.location.pathname).toBe("/custom/new");
  });

  it("asks when the header back link is followed with edits", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    await fillDeck(user);
    await user.click(screen.getByRole("link", { name: "Back to your decks" }));
    expect(await screen.findByText(discardDialogTitle)).toBeVisible();
    expect(router.state.location.pathname).toBe("/custom/new");
  });

  it("asks the browser to confirm a reload only while there are edits", async () => {
    const user = userEvent.setup();
    await renderEditor();
    const unloadEvent = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event;
    };
    expect(unloadEvent().defaultPrevented).toBe(false);
    await fillDeck(user);
    expect(unloadEvent().defaultPrevented).toBe(true);
  });
});

describe("DeckEditorForm draft autosave", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCustomDeckDraft();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    customDecksStore.set([]);
  });

  const typeAndAutosave = async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const view = await renderEditor();
    await fillDeck(user);
    await act(() => vi.advanceTimersByTime(600));
    return { user, ...view };
  };

  it("offers to restore an autosaved draft that differs from the saved deck", async () => {
    const { user, unmount } = await typeAndAutosave();
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)?.title).toBe("Road trip");
    unmount();
    await renderEditor();
    expect(await screen.findByText(restoreDialogTitle)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getByLabelText("Deck title")).toHaveValue("Road trip");
    expect(screen.getByRole("textbox", { name: /^Card 1/ })).toHaveValue(
      "Where should we go next?"
    );
  });

  it("does not save before the typing pauses", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderEditor();
    await user.type(screen.getByLabelText("Deck title"), "Road");
    await act(() => vi.advanceTimersByTime(300));
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
    await act(() => vi.advanceTimersByTime(300));
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)?.title).toBe("Road");
  });

  it("writes the pending draft at once when the page is hidden", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderEditor();
    await user.type(screen.getByLabelText("Deck title"), "Road");
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();

    // The player switches app; the phone may close the tab before the timer fires.
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    try {
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
    } finally {
      Reflect.deleteProperty(document, "visibilityState");
    }
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)?.title).toBe("Road");
  });

  it("writes nothing when the page comes back into view", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderEditor();
    await user.type(screen.getByLabelText("Deck title"), "Road");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
  });

  it("writes the pending draft at once when the page is left", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderEditor();
    await user.type(screen.getByLabelText("Deck title"), "Road");
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)?.title).toBe("Road");
  });

  it("Discard on the restore offer clears the draft", async () => {
    const { user, unmount } = await typeAndAutosave();
    unmount();
    await renderEditor();
    await screen.findByText(restoreDialogTitle);
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
    expect(screen.getByLabelText("Deck title")).toHaveValue("");
  });

  it("does not offer a draft equal to the saved deck, and drops it", async () => {
    await renderEditor();
    saveCustomDeckDraft({
      deckKey: NEW_DECK_DRAFT_KEY,
      title: "",
      cards: [{ key: "draft-card-x", type: "question", text: "" }],
      savedAt: Date.now(),
    });
    await renderEditor();
    expect(screen.queryByText(restoreDialogTitle)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined()
    );
  });

  it("clears the draft when the edits return to the saved state", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderEditor();
    await user.type(screen.getByLabelText("Deck title"), "A");
    await act(() => vi.advanceTimersByTime(600));
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeDefined();
    await user.clear(screen.getByLabelText("Deck title"));
    await act(() => vi.advanceTimersByTime(600));
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
  });

  it("leaves another deck's draft alone", async () => {
    saveCustomDeckDraft({
      deckKey: "custom-abc1234567",
      title: "Other",
      cards: [{ key: "k", type: "question", text: "Hi?" }],
      savedAt: Date.now(),
    });
    await renderEditor();
    await act(() => vi.advanceTimersByTime(1000));
    expect(loadCustomDeckDraft("custom-abc1234567")?.title).toBe("Other");
  });

  it("Discard in the leave dialog clears the draft and a late timer does not bring it back", async () => {
    const { user, router } = await typeAndAutosave();
    await user.type(screen.getByLabelText("Deck title"), "!");
    await navigateAway(router, "/elsewhere");
    await screen.findByText(discardDialogTitle);
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await screen.findByText("Somewhere else");
    await act(() => vi.advanceTimersByTime(1000));
    expect(loadCustomDeckDraft(NEW_DECK_DRAFT_KEY)).toBeUndefined();
  });
});
