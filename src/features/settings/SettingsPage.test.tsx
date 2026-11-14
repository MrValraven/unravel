import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { LocaleProvider } from "../../i18n/LocaleContext";
import { settingsStore, useSettings } from "../../storage/settings";
import {
  recordCardSeen,
  recordDeckFinish,
  recordDeckStart,
  statsStore,
} from "../../storage/stats";
import SettingsPage from "./SettingsPage";

vi.mock("../decks/install/InstallPrompt", () => ({ default: () => null }));

/** Mirrors main.tsx: the locale follows the stored settings. */
const LocalizedSettingsPage = () => {
  const [settings] = useSettings();
  return (
    <LocaleProvider locale={settings.locale}>
      <MemoryRouter initialEntries={["/settings"]}>
        <SettingsPage />
      </MemoryRouter>
    </LocaleProvider>
  );
};

const renderSettings = () => render(<LocalizedSettingsPage />);

describe("SettingsPage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    Reflect.deleteProperty(navigator, "vibrate");
  });

  it("switches the whole page to Portuguese at once", async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(
      screen.getByRole("heading", { level: 1, name: "Settings" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Português" }));

    expect(settingsStore.get().locale).toBe("pt");
    expect(
      screen.getByRole("heading", { level: 1, name: "Definições" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("saves the chosen text size", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Large" }));
    expect(settingsStore.get().textScale).toBe(1.15);
    expect(screen.getByRole("button", { name: "Large" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByText("What made you smile this week?")
    ).toBeInTheDocument();
  });

  it("turns dim mode on", async () => {
    const user = userEvent.setup();
    renderSettings();
    const dimSwitch = screen.getByRole("switch", { name: /Dim mode/ });
    await user.click(dimSwitch);
    expect(settingsStore.get().isDimMode).toBe(true);
    expect(dimSwitch).toHaveAttribute("aria-checked", "true");
  });

  it("hides the haptics switch on devices without vibration", () => {
    Reflect.deleteProperty(navigator, "vibrate");
    renderSettings();
    expect(
      screen.queryByRole("switch", { name: /Haptics/ })
    ).not.toBeInTheDocument();
  });

  it("shows the haptics switch when the device can vibrate", async () => {
    Object.defineProperty(navigator, "vibrate", {
      value: vi.fn(),
      configurable: true,
    });
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("switch", { name: /Haptics/ }));
    expect(settingsStore.get().isHapticsEnabled).toBe(false);
  });

  it("shows local stats and resets them after confirming", async () => {
    recordDeckStart("unravel");
    recordDeckStart("unravel");
    recordDeckStart("first-date");
    recordCardSeen();
    recordCardSeen();
    recordCardSeen();
    recordDeckFinish("unravel", 150_000);
    const user = userEvent.setup();
    renderSettings();

    const statsSection = screen.getByRole("region", { name: "Your nights" });
    expect(
      within(statsSection).getByText("Cards seen").nextSibling
    ).toHaveTextContent("3");
    expect(
      within(statsSection).getByText("Decks finished").nextSibling
    ).toHaveTextContent("1");
    expect(
      within(statsSection).getByText("Minutes played").nextSibling
    ).toHaveTextContent("3");
    expect(within(statsSection).getByText("Unravel")).toBeInTheDocument();

    await user.click(
      within(statsSection).getByRole("button", { name: "Reset stats" })
    );
    const dialog = screen.getByRole("dialog", { name: "Reset your stats?" });
    await user.click(
      within(dialog).getByRole("button", { name: "Reset stats" })
    );

    expect(statsStore.get().cardsSeen).toBe(0);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      within(statsSection).getByText("Play a deck and your nights add up here.")
    ).toBeInTheDocument();
  });

  it("keeps the stats when the reset is cancelled", async () => {
    recordCardSeen();
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Reset stats" }));
    await user.click(screen.getByRole("button", { name: "Keep stats" }));
    expect(statsStore.get().cardsSeen).toBe(1);
  });

  it("links to a prefilled question suggestion in a new tab", () => {
    renderSettings();
    const suggestLink = screen.getByRole("link", {
      name: /Suggest a question/,
    });
    expect(suggestLink.getAttribute("href")).toMatch(
      /^https:\/\/github\.com\/MrValraven\/unravel\/issues\/new\?/
    );
    expect(suggestLink).toHaveAttribute("target", "_blank");
    expect(suggestLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("opens the release notes and shows the version and privacy line", async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(screen.getByText(`Version ${__APP_VERSION__}`)).toBeInTheDocument();
    expect(
      screen.getByText("Everything you do here stays on this device")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "See what's new" }));
    expect(
      screen.getByRole("dialog", { name: "What's new" })
    ).toBeInTheDocument();
  });
});
