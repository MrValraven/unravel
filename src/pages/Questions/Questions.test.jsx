import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Questions from "./Questions";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Questions />
    </MemoryRouter>
  );

describe("Questions page", () => {
  beforeEach(() => localStorage.clear());

  it("shows the mode list", () => {
    renderPage();
    expect(screen.getByText("Choose a mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unravel" })).toBeInTheDocument();
  });

  it("groups modes into labelled sections without losing any", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Make Friends & Socialize" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Dating & Romance" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Adults/ })
    ).toBeInTheDocument();
    // Every mode renders as a button, plus the top-nav install icon button.
    expect(screen.getAllByRole("button")).toHaveLength(18);
  });

  it("shows how many questions each mode has", () => {
    renderPage();
    const unravel = screen.getByRole("button", { name: "Unravel" });
    expect(unravel).toHaveTextContent(/\d+ questions/);
  });

  it("starts a family-friendly mode immediately", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Unravel" }));
    // The selected mode's title is now shown during play.
    expect(screen.getByRole("heading", { name: "Unravel" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("gates an explicit mode behind an 18+ confirmation", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /Inferno of Lust/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Adult content ahead/)).toBeInTheDocument();
  });

  it("proceeds after confirming age and remembers the choice", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /Inferno of Lust/ }));
    await user.click(screen.getByRole("button", { name: /18 or older/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("ageConfirmed")).toBe("true");
  });

  it("cancels the gate without starting the mode", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /Safe Kink/ }));
    await user.click(screen.getByRole("button", { name: /Go back/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Choose a mode")).toBeInTheDocument();
  });

  it("shows an install icon that opens PWA install instructions", async () => {
    const user = userEvent.setup();
    renderPage();
    const installButton = screen.getByRole("button", {
      name: "Install App",
    });
    expect(installButton).toBeInTheDocument();
    await user.click(installButton);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Install Unravel" })
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
