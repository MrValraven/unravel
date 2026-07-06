import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// Control the PWA update state without touching the real service-worker glue.
const { updateState, applyUpdate } = vi.hoisted(() => ({
  updateState: { updateAvailable: false },
  applyUpdate: vi.fn(),
}));

vi.mock("./useAppUpdate", () => ({
  useAppUpdate: () => ({
    updateAvailable: updateState.updateAvailable,
    applyUpdate,
  }),
}));

import Home from "./Home";

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe("Home update button", () => {
  beforeEach(() => {
    updateState.updateAvailable = false;
    applyUpdate.mockClear();
  });

  it("hides the update button when no new version is available", () => {
    updateState.updateAvailable = false;
    renderHome();
    expect(
      screen.queryByRole("button", { name: /new version available/i })
    ).not.toBeInTheDocument();
  });

  it("shows the update button when a new version is available", () => {
    updateState.updateAvailable = true;
    renderHome();
    expect(
      screen.getByRole("button", { name: /new version available/i })
    ).toBeInTheDocument();
  });

  it("applies the update when the button is clicked", async () => {
    updateState.updateAvailable = true;
    const user = userEvent.setup();
    renderHome();
    await user.click(
      screen.getByRole("button", { name: /new version available/i })
    );
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });
});
