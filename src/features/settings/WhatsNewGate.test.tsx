import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { settingsStore, updateSettings } from "../../storage/settings";
import WhatsNewGate from "./WhatsNewGate";

const renderGate = (path = "/decks") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <WhatsNewGate />
    </MemoryRouter>
  );

describe("WhatsNewGate", () => {
  beforeEach(() => localStorage.clear());

  it("stores the version quietly on a first visit", async () => {
    renderGate();
    await waitFor(() =>
      expect(settingsStore.get().lastSeenVersion).toBe(__APP_VERSION__)
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the notes once after an update and stores the version on close", async () => {
    const user = userEvent.setup();
    updateSettings({ lastSeenVersion: "1.0.0" });
    renderGate();

    const dialog = screen.getByRole("dialog", { name: "What's new" });
    expect(dialog).toHaveTextContent("Version 2.0.0");
    expect(settingsStore.get().lastSeenVersion).toBe("1.0.0");

    await user.click(screen.getByRole("button", { name: "Close what's new" }));
    expect(settingsStore.get().lastSeenVersion).toBe(__APP_VERSION__);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("stays closed when the player has seen this version", () => {
    updateSettings({ lastSeenVersion: __APP_VERSION__ });
    renderGate();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("leaves a newer stored version alone in a stale tab", async () => {
    updateSettings({ lastSeenVersion: "9.0.0" });
    renderGate();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(settingsStore.get().lastSeenVersion).toBe("9.0.0")
    );
  });

  it("waits while a card is on screen and opens once the player leaves the game", async () => {
    const user = userEvent.setup();
    updateSettings({ lastSeenVersion: "1.0.0" });
    render(
      <MemoryRouter initialEntries={["/play/unravel"]}>
        <Routes>
          <Route
            path="/play/:deckId"
            element={<Link to="/decks">Leave game</Link>}
          />
          <Route path="/decks" element={<p>Deck picker</p>} />
        </Routes>
        <WhatsNewGate />
      </MemoryRouter>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(settingsStore.get().lastSeenVersion).toBe("1.0.0");

    await user.click(screen.getByRole("link", { name: "Leave game" }));
    expect(screen.getByText("Deck picker")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "What's new" })
    ).toBeInTheDocument();
  });

  it("shows the notes on the deck end page", () => {
    updateSettings({ lastSeenVersion: "1.0.0" });
    renderGate("/play/unravel/done");
    expect(
      screen.getByRole("dialog", { name: "What's new" })
    ).toBeInTheDocument();
  });
});
