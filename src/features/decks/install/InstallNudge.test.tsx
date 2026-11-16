import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isInstallNudgeDismissed } from "../../../storage/installNudge";
import { InstallNudge } from "./InstallNudge";
import { getInstallPromptSnapshot, promptInstall } from "./installPromptStore";

const handOverInstallPrompt = () => {
  const prompt = vi.fn(() => Promise.resolve());
  const installEvent = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    {
      prompt,
      userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    }
  );
  act(() => {
    window.dispatchEvent(installEvent);
  });
  return prompt;
};

describe("InstallNudge", () => {
  beforeEach(() => window.localStorage.clear());

  afterEach(async () => {
    vi.restoreAllMocks();
    // A prompt left in the page-wide store would leak into the next test.
    await act(() => promptInstall());
  });

  it("stays hidden where installing is not possible", () => {
    const { container } = render(<InstallNudge placement="deck-end" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers the browser's own prompt when it has one", async () => {
    const prompt = handOverInstallPrompt();
    const user = userEvent.setup();
    render(<InstallNudge placement="deck-end" />);
    expect(
      screen.getByRole("complementary", { name: "Keep Unravel one tap away" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Install" }));
    expect(prompt).toHaveBeenCalledOnce();
    expect(getInstallPromptSnapshot().deferredPrompt).toBeNull();
  });

  it("remembers Not now for its placement only", async () => {
    handOverInstallPrompt();
    const user = userEvent.setup();
    const { container } = render(<InstallNudge placement="deck-end" />);
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(container).toBeEmptyDOMElement();
    expect(isInstallNudgeDismissed("deck-end")).toBe(true);
    expect(isInstallNudgeDismissed("home")).toBe(false);
  });

  it("shows the Add to Home Screen steps inline on iOS", async () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
    );
    const user = userEvent.setup();
    render(<InstallNudge placement="home" />);
    const toggle = screen.getByRole("button", { name: "How to install" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(
      screen.getByRole("list", { name: "How to install" })
    ).toHaveTextContent("Choose Add to Home Screen.");
    expect(
      screen.getByRole("button", { name: "Hide the steps" })
    ).toHaveAttribute("aria-expanded", "true");
  });
});
