import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InstallPrompt from "./InstallPrompt";

describe("InstallPrompt", () => {
  it("renders an install icon button", () => {
    render(<InstallPrompt />);
    expect(
      screen.getByRole("button", { name: "Install App" })
    ).toBeInTheDocument();
  });

  it("opens a modal with install instructions when clicked", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByRole("button", { name: "Install App" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Install Unravel" })
    ).toBeInTheDocument();
    // Under jsdom the platform resolves to desktop; steps render as a list.
    expect(within(dialog).getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("closes the modal with the Close button", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByRole("button", { name: "Install App" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
