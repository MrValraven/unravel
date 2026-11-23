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
import { BACKUP_FORMAT, BACKUP_VERSION } from "../../storage/backup";
import { customDecksStore, type CustomDeck } from "../../storage/customDecks";
import { favouritesStore } from "../../storage/favourites";
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

const backupTextWithVersion = (version: number) =>
  JSON.stringify({
    format: BACKUP_FORMAT,
    version,
    exportedAt: "2026-11-23T10:00:00.000Z",
    customDecks: [],
    favourites: [],
    stats: {},
  });

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

  it("starts on the Night theme and saves the chosen theme", async () => {
    const user = userEvent.setup();
    renderSettings();
    const themeGroup = screen.getByRole("group", { name: "Theme" });
    expect(
      within(themeGroup).getByRole("button", { name: "Night" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(themeGroup).toHaveAccessibleDescription(/Day is bright/);

    await user.click(within(themeGroup).getByRole("button", { name: "Day" }));
    expect(settingsStore.get().theme).toBe("light");
    expect(
      within(themeGroup).getByRole("button", { name: "Day" })
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(within(themeGroup).getByRole("button", { name: "Dim" }));
    expect(settingsStore.get().theme).toBe("dim");
  });

  it("names the themes in Portuguese", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Português" }));
    const themeGroup = screen.getByRole("group", { name: "Tema" });
    for (const name of ["Noite", "Penumbra", "Dia"]) {
      expect(
        within(themeGroup).getByRole("button", { name })
      ).toBeInTheDocument();
    }
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

  describe("Your data", () => {
    const makeDeck = (id: string, updatedAt = 1000): CustomDeck => ({
      id: `custom-${id}`,
      title: `Deck ${id}`,
      cards: [{ id: `${id}-1`, type: "question", text: "Hello?" }],
      createdAt: 500,
      updatedAt,
    });
    const backupText = (overrides: Record<string, unknown> = {}) =>
      JSON.stringify({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: "2026-11-23T10:00:00.000Z",
        customDecks: [],
        favourites: [],
        stats: {
          decksStarted: {},
          decksFinished: {},
          cardsSeen: 0,
          millisecondsPlayed: 0,
        },
        ...overrides,
      });
    const backupInput = () => screen.getByLabelText("Backup file");
    const uploadBackup = async (
      user: ReturnType<typeof userEvent.setup>,
      content: string | Blob,
      name = "backup.json",
      type = "application/json"
    ) => {
      const file = new File([content], name, { type });
      await user.upload(backupInput() as HTMLInputElement, file);
    };

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it("exports a backup file named by today's date", async () => {
      vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 23, 15) });
      const createObjectURL = vi.fn(() => "blob:unravel-backup");
      Object.defineProperty(URL, "createObjectURL", {
        value: createObjectURL,
        configurable: true,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        value: vi.fn(),
        configurable: true,
      });
      let downloadName = "";
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        function (this: HTMLAnchorElement) {
          downloadName = this.download;
        }
      );
      customDecksStore.set([makeDeck("a")]);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettings();

      await user.click(screen.getByRole("button", { name: "Export backup" }));

      expect(downloadName).toBe("unravel-backup-2026-11-23.json");
      const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
      expect(blob.type).toBe("application/json");
      const exported = JSON.parse(await blob.text());
      expect(exported).toMatchObject({
        format: "unravel-backup",
        version: 1,
        customDecks: [{ id: "custom-a" }],
      });
      expect(
        screen.getByText(
          "Started the download of unravel-backup-2026-11-23.json"
        )
      ).toBeInTheDocument();
    });

    it("previews what an imported backup holds and merges it on confirm", async () => {
      favouritesStore.set(["mine-001"]);
      const user = userEvent.setup();
      renderSettings();
      await uploadBackup(
        user,
        backupText({
          customDecks: [makeDeck("a"), makeDeck("b"), makeDeck("c")],
          favourites: ["mine-001", "x-001", "x-002"],
        })
      );

      const dialog = await screen.findByRole("dialog", {
        name: "Import this backup?",
      });
      expect(dialog).toHaveTextContent("3 decks, 3 favourites");
      expect(customDecksStore.get()).toHaveLength(0);

      await user.click(within(dialog).getByRole("button", { name: "Import" }));

      expect(customDecksStore.get().map((deck) => deck.id)).toEqual([
        "custom-a",
        "custom-b",
        "custom-c",
      ]);
      expect(favouritesStore.get()).toEqual(["mine-001", "x-001", "x-002"]);
      expect(
        screen.getByText("Imported 3 new decks, 2 new favourites")
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });

    it("writes nothing when the preview is cancelled", async () => {
      const user = userEvent.setup();
      renderSettings();
      await uploadBackup(user, backupText({ customDecks: [makeDeck("a")] }));
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(customDecksStore.get()).toHaveLength(0);
    });

    it("says nothing new when the same backup is imported twice", async () => {
      const user = userEvent.setup();
      renderSettings();
      const text = backupText({
        customDecks: [makeDeck("a")],
        favourites: ["x-001"],
      });
      await uploadBackup(user, text);
      await user.click(
        within(await screen.findByRole("dialog")).getByRole("button", {
          name: "Import",
        })
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      const afterFirst = { ...localStorage };

      await uploadBackup(user, text);
      await user.click(
        within(await screen.findByRole("dialog")).getByRole("button", {
          name: "Import",
        })
      );

      expect(
        screen.getByText(
          "Nothing new: the decks and favourites in this backup are already on this device"
        )
      ).toBeInTheDocument();
      expect({ ...localStorage }).toEqual(afterFirst);
      expect(customDecksStore.get()).toHaveLength(1);
      expect(favouritesStore.get()).toEqual(["x-001"]);
    });

    it("keeps the problem alert in place and empty until a problem lands in it", async () => {
      const user = userEvent.setup();
      renderSettings();
      // Mounted from the start, so screen readers hear the problem when it arrives.
      const alert = screen.getByRole("alert");
      expect(alert).toBeEmptyDOMElement();
      expect(alert).not.toHaveAttribute("hidden");

      await uploadBackup(user, "{}");
      expect(await screen.findByRole("alert")).toBe(alert);
      expect(alert).toHaveTextContent("This file isn't an Unravel backup");
    });

    it.each([
      [
        "a text file that is not JSON",
        "hello there",
        "This file isn't readable JSON",
      ],
      ["JSON that is not a backup", "{}", "This file isn't an Unravel backup"],
      [
        "a backup from a newer version",
        backupTextWithVersion(2),
        "This backup is from a newer version of Unravel. Update the app and try again",
      ],
      ["an empty file", "", "This file isn't readable JSON"],
    ])("names the problem for %s", async (_label, content, message) => {
      const user = userEvent.setup();
      renderSettings();
      await uploadBackup(user, content);
      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("refuses an image by naming the cause and writes nothing", async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderSettings();
      await uploadBackup(
        user,
        new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0xff])]),
        "photo.png",
        "image/png"
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This file isn't readable JSON"
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(localStorage.length).toBe(0);
    });

    it("refuses a file over the size limit without reading it", async () => {
      const user = userEvent.setup();
      renderSettings();
      const hugeFile = new File(["{}"], "huge.json", {
        type: "application/json",
      });
      Object.defineProperty(hugeFile, "size", { value: 50 * 1024 * 1024 });
      const readText = vi.spyOn(hugeFile, "text");
      await user.upload(backupInput() as HTMLInputElement, hugeFile);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This file is too large to be an Unravel backup"
      );
      expect(readText).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("says how many decks were skipped at the 50 deck limit", async () => {
      customDecksStore.set(
        Array.from({ length: 48 }, (_, index) => makeDeck(`mine${index}`))
      );
      const user = userEvent.setup();
      renderSettings();
      await uploadBackup(
        user,
        backupText({
          customDecks: Array.from({ length: 5 }, (_, index) =>
            makeDeck(`new${index}`)
          ),
        })
      );
      await user.click(
        within(await screen.findByRole("dialog")).getByRole("button", {
          name: "Import",
        })
      );
      expect(screen.getByText("Imported 2 new decks")).toBeInTheDocument();
      expect(
        screen.getByText(
          "3 decks were not imported: you already have the 50 decks Unravel keeps on one device"
        )
      ).toBeInTheDocument();
      expect(customDecksStore.get()).toHaveLength(50);
    });

    it("says so, with the cause, when the browser refuses the write", async () => {
      favouritesStore.set(["mine-001"]);
      const user = userEvent.setup();
      renderSettings();
      await uploadBackup(user, backupText({ favourites: ["x-001"] }));
      const dialog = await screen.findByRole("dialog");
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

      await user.click(within(dialog).getByRole("button", { name: "Import" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Your browser blocked saving: storage is full or turned off, so the backup was not imported"
      );
      expect(screen.queryByText(/^Imported/)).not.toBeInTheDocument();
      expect(favouritesStore.get()).toEqual(["mine-001"]);
    });

    it("shows the section in Portuguese", async () => {
      const user = userEvent.setup();
      renderSettings();
      await user.click(screen.getByRole("button", { name: "Português" }));
      expect(
        screen.getByRole("button", { name: "Exportar cópia de segurança" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Os teus dados" })
      ).toBeInTheDocument();
    });
  });
});
