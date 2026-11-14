import { describe, it, expect } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InstallPrompt from "./InstallPrompt";
import { getInstallPromptSnapshot } from "./installPromptStore";

describe("InstallPrompt", () => {
  it("renders an install button", () => {
    render(<InstallPrompt />);
    expect(
      screen.getByRole("button", { name: "Install app" })
    ).toBeInTheDocument();
  });

  it("renders a labelled row for lists such as Settings", () => {
    render(<InstallPrompt variant="row" className="list-row" />);
    const row = screen.getByRole("button", { name: "Install app" });
    expect(row).toHaveClass("install-prompt__row", "list-row");
    expect(row).toHaveTextContent("Install app");
  });

  it("opens a dialog with install steps", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByRole("button", { name: "Install app" }));
    const dialog = screen.getByRole("dialog", { name: "Install Unravel" });
    // jsdom resolves to the desktop steps.
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
    expect(dialog).not.toHaveTextContent("{menu}");
  });

  it("keeps a prompt the browser handed over before the button mounted", async () => {
    const installEvent = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        prompt: () => Promise.resolve(),
        userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
      }
    );
    // The store listens from import time, so the event can arrive first.
    window.dispatchEvent(installEvent);
    expect(getInstallPromptSnapshot().deferredPrompt).toBe(installEvent);
    expect(installEvent.defaultPrevented).toBe(true);

    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByRole("button", { name: "Install app" }));
    const dialog = screen.getByRole("dialog", { name: "Install Unravel" });
    await user.click(
      within(dialog).getByRole("button", { name: "Install Unravel" })
    );
    // A captured prompt can only be used once.
    expect(getInstallPromptSnapshot().deferredPrompt).toBeNull();
  });

  it("closes the dialog with the Close button", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByRole("button", { name: "Install app" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  // Last: the store is module state, and an install stays recorded for the page load.
  it("keeps an open dialog mounted when the app finishes installing", async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);
    await user.click(screen.getByRole("button", { name: "Install app" }));
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(
      screen.queryByRole("button", { name: "Install app" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Install Unravel" })
    ).toBeInTheDocument();
  });
});
