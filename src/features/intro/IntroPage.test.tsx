import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { settingsStore } from "../../storage/settings";
import IntroPage from "./IntroPage";

const renderIntro = () =>
  render(
    <MemoryRouter initialEntries={["/about"]}>
      <Routes>
        <Route path="/about" element={<IntroPage />} />
        <Route path="/decks" element={<p>Deck picker</p>} />
      </Routes>
    </MemoryRouter>
  );

describe("IntroPage", () => {
  beforeEach(() => localStorage.clear());

  it("explains Unravel and how the cards work", () => {
    renderIntro();
    expect(
      screen.getByRole("heading", { level: 1, name: "What is Unravel?" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How the cards work" })
    ).toBeInTheDocument();
    for (const kindTitle of [
      "Questions",
      "Challenges",
      "Everyone cards",
      "Levels",
      "Pass",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name: kindTitle })
      ).toBeInTheDocument();
    }
  });

  it("remembers the intro was seen and opens the decks", async () => {
    const user = userEvent.setup();
    renderIntro();
    await user.click(screen.getByRole("button", { name: "Start playing" }));
    expect(settingsStore.get().hasSeenIntro).toBe(true);
    expect(screen.getByText("Deck picker")).toBeInTheDocument();
  });
});
