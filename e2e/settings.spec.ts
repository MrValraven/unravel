import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { returningPlayerSettings, seedStorage } from "./helpers";

test.describe("settings", () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page);
  });

  test("switching to Português translates the app and survives a reload", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { level: 1, name: "Settings" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await page.getByRole("button", { name: "Português" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Definições" })
    ).toBeVisible();
    await expect(page.getByText("Idioma", { exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");

    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Definições" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Português" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Começar" })).toBeVisible();
    await page.goto("/decks");
    await expect(
      page.getByRole("heading", { level: 1, name: "Baralhos" })
    ).toBeVisible();
  });

  test("text size persists across a reload", async ({ page }) => {
    const readTextScale = () =>
      page.evaluate(() =>
        document.documentElement.style.getPropertyValue("--text-scale")
      );

    await page.goto("/settings");
    await expect.poll(readTextScale).toBe("1");
    await page.getByRole("button", { name: "Larger", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Larger", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect.poll(readTextScale).toBe("1.3");

    await page.reload();
    await expect(
      page.getByRole("button", { name: "Larger", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect.poll(readTextScale).toBe("1.3");
  });

  test("the chosen theme persists across a reload", async ({ page }) => {
    await page.goto("/settings");
    const themeGroup = page.getByRole("group", { name: "Theme" });
    await expect(
      themeGroup.getByRole("button", { name: "Night", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "default");

    await themeGroup.getByRole("button", { name: "Dim", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dim");

    await themeGroup.getByRole("button", { name: "Day", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
      "content",
      "light"
    );

    await page.reload();
    await expect(
      page
        .getByRole("group", { name: "Theme" })
        .getByRole("button", { name: "Day", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("a saved dim mode switch from an older version opens in the dim theme", async ({
    page,
  }) => {
    const { theme: _theme, ...olderSettings } = returningPlayerSettings;
    await seedStorage(page, {
      extra: { settings: { ...olderSettings, isDimMode: true } },
    });
    await page.goto("/settings");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dim");
    await expect(
      page
        .getByRole("group", { name: "Theme" })
        .getByRole("button", { name: "Dim", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("a backup file restores a custom deck on a fresh page", async ({
    browser,
    page,
  }) => {
    const deck = {
      id: "custom-e2e-backup",
      title: "Backup crew",
      cards: [{ id: "c1", type: "question", text: "What would you save?" }],
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    };
    await seedStorage(page, { extra: { customDecks: [deck] } });
    await page.goto("/settings");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export backup" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^unravel-backup-.*\.json$/);
    const backupPath = await download.path();
    expect(await readFile(backupPath, "utf8")).toContain("Backup crew");

    const freshContext = await browser.newContext(test.info().project.use);
    const freshPage = await freshContext.newPage();
    await seedStorage(freshPage);
    await freshPage.goto("/settings");
    await freshPage.getByLabel("Backup file").setInputFiles(backupPath);

    const preview = freshPage.getByRole("dialog", {
      name: "Import this backup?",
    });
    await expect(preview).toBeVisible();
    await expect(preview.getByText(/1 deck/)).toBeVisible();
    await preview.getByRole("button", { name: "Import" }).click();
    await expect(freshPage.getByText(/Imported 1 new deck/)).toBeVisible();

    await freshPage.goto("/custom");
    await expect(
      freshPage.getByRole("heading", { level: 2, name: "Backup crew" })
    ).toBeVisible();
    await freshContext.close();
  });
});
