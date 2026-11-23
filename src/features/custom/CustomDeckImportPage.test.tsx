import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { customDecksStore, listCustomDecks } from "../../storage/customDecks";
import CustomDeckImportPage from "./CustomDeckImportPage";
import { buildShareUrl } from "./codec";

const sharedDeck = {
  title: "Road trip",
  cards: [{ type: "question" as const, text: "Where should we go next?" }],
};

const renderImport = async () => {
  const shareUrl = new URL(buildShareUrl(sharedDeck, "https://unravel.test"));
  const router = createMemoryRouter(
    [
      { path: "/custom/import", element: <CustomDeckImportPage /> },
      { path: "/custom", element: <p>Your decks list</p> },
    ],
    { initialEntries: [`${shareUrl.pathname}${shareUrl.hash}`] }
  );
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
};

const blockStorageWrites = () =>
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("full", "QuotaExceededError");
  });

describe("CustomDeckImportPage saving", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    // A blocked save leaves its deck in the store's memory; clear it for the next test.
    act(() => customDecksStore.set([]));
  });

  it("saves the deck and goes to the list", async () => {
    const user = userEvent.setup();
    await renderImport();
    await user.click(screen.getByRole("button", { name: /Save to my decks/ }));
    expect(await screen.findByText("Your decks list")).toBeVisible();
    expect(listCustomDecks()).toHaveLength(1);
  });

  it("names the cause and keeps the import page when saving is blocked", async () => {
    const user = userEvent.setup();
    const router = await renderImport();
    blockStorageWrites();
    await user.click(screen.getByRole("button", { name: /Save to my decks/ }));
    expect(
      await screen.findByText(
        /Your browser blocked saving: storage is full or turned off/
      )
    ).toBeVisible();
    expect(router.state.location.pathname).toBe("/custom/import");
    await user.click(screen.getByRole("button", { name: /Save to my decks/ }));
    expect(listCustomDecks()).toHaveLength(1);
  });
});
