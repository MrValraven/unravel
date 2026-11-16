import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import DeckFinderPage from "./DeckFinderPage";

const PlayRouteProbe = () => {
  const { deckId } = useParams();
  return <p>Playing {deckId}</p>;
};

const renderFinder = () =>
  render(
    <MemoryRouter initialEntries={["/finder"]}>
      <Routes>
        <Route path="/finder" element={<DeckFinderPage />} />
        <Route path="/play/:deckId" element={<PlayRouteProbe />} />
      </Routes>
    </MemoryRouter>
  );

describe("DeckFinderPage", () => {
  beforeEach(() => {
    localStorage.clear();
    // Outside every seasonal window, so only the year-round decks rank.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-15T12:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("moves focus to each new question as the player answers", async () => {
    const user = userEvent.setup();
    renderFinder();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "A date" }));
    expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What is the mood?" })
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Light and easy" }));
    expect(screen.getByRole("heading", { name: "How spicy?" })).toHaveFocus();
  });

  it("goes back one question and keeps the earlier answer selected", async () => {
    const user = userEvent.setup();
    renderFinder();
    await user.click(screen.getByRole("button", { name: "A date" }));
    await user.click(screen.getByRole("button", { name: "Previous question" }));
    expect(
      screen.getByRole("heading", { name: "Who are you with?" })
    ).toHaveFocus();
    expect(screen.getByRole("button", { name: "A date" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("suggests up to three decks and starts one", async () => {
    const user = userEvent.setup();
    renderFinder();
    await user.click(screen.getByRole("button", { name: "A date" }));
    await user.click(screen.getByRole("button", { name: "Light and easy" }));
    await user.click(screen.getByRole("button", { name: "Keep it clean" }));
    const results = screen.getByRole("region", { name: "Try one of these" });
    expect(
      screen.getByRole("heading", { name: "Try one of these" })
    ).toHaveFocus();
    expect(within(results).getAllByRole("article")).toHaveLength(3);
    await user.click(
      within(results).getByRole("button", { name: "Start deck: First Date" })
    );
    expect(screen.getByText("Playing first-date")).toBeInTheDocument();
  });

  it("asks for age before starting an adult suggestion", async () => {
    const user = userEvent.setup();
    renderFinder();
    await user.click(screen.getByRole("button", { name: "My partner" }));
    await user.click(screen.getByRole("button", { name: "Flirty" }));
    await user.click(screen.getByRole("button", { name: "Adults only (18+)" }));
    const results = screen.getByRole("region", { name: "Try one of these" });
    const firstStart = within(results).getAllByRole("button", {
      name: /^Start deck: /,
    })[0];
    if (!firstStart) throw new Error("No suggestion to start");
    await user.click(firstStart);
    expect(
      screen.getByRole("dialog", { name: "Adult content ahead" })
    ).toBeInTheDocument();
  });

  it("starts over from the first question with no answers kept", async () => {
    const user = userEvent.setup();
    renderFinder();
    await user.click(screen.getByRole("button", { name: "A date" }));
    await user.click(screen.getByRole("button", { name: "Light and easy" }));
    await user.click(screen.getByRole("button", { name: "Keep it clean" }));
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(
      screen.getByRole("heading", { name: "Who are you with?" })
    ).toHaveFocus();
    expect(screen.getByRole("button", { name: "A date" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
