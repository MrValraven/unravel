import { expect, test } from "@playwright/test";
import { buildSavedProgress, readStoredText, seedStorage } from "./helpers";

test.describe("playing a deck", () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page);
  });

  test("home opens the decks picker for a returning player", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Unravel" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Card of the day" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Get started" }).click();
    await expect(page).toHaveURL(/\/decks$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Decks" })
    ).toBeVisible();
  });

  test("picks a deck, previews it, plays cards, goes Back to the picker and resumes", async ({
    page,
  }) => {
    await page.goto("/decks");
    await page.getByRole("button", { name: "Unravel", exact: true }).click();

    const previewSheet = page.getByRole("dialog", { name: "Unravel" });
    await expect(previewSheet).toBeVisible();
    await expect(
      previewSheet.getByRole("heading", { name: "A taste of the deck" })
    ).toBeVisible();
    await previewSheet.getByRole("button", { name: "Start deck" }).click();

    await expect(page).toHaveURL(/\/play\/unravel$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Unravel" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Start deck", exact: true }).click();

    await expect(page.getByText(/^Card 1 of \d+$/)).toBeVisible();
    await expect(page).toHaveURL(/\/play\/unravel\?card=1$/);

    await page.getByRole("button", { name: "Next card" }).click();
    await expect(page.getByText(/^Card 2 of \d+$/)).toBeVisible();
    await page.getByRole("button", { name: "Next card" }).click();
    await expect(page.getByText(/^Card 3 of \d+$/)).toBeVisible();
    await page.getByRole("button", { name: "Previous card" }).click();
    await expect(page.getByText(/^Card 2 of \d+$/)).toBeVisible();
    await expect(page).toHaveURL(/\?card=2$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/decks$/);
    await expect(page.getByText("Pick up where you left off")).toBeVisible();
    await expect(page.getByText(/^Card 2 of \d+$/)).toBeVisible();

    await page
      .getByRole("link", { name: "Continue deck", exact: true })
      .click();
    await expect(page).toHaveURL(/\/play\/unravel\?card=2$/);
    await expect(page.getByText(/^Card 2 of \d+$/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Previous card" })
    ).toBeEnabled();
  });

  test("the home resume card continues a saved game", async ({ page }) => {
    await seedStorage(page, {
      extra: {
        progress: buildSavedProgress(
          "unravel",
          ["unravel-001", "unravel-002", "unravel-003"],
          2
        ),
      },
    });
    await page.goto("/");
    await expect(page.getByText("Pick up where you left off")).toBeVisible();
    await page
      .getByRole("link", { name: "Continue deck", exact: true })
      .click();
    await expect(page.getByText(/^Card 3 of 3$/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Finish deck" })
    ).toBeVisible();
  });

  test("a deck landing page starts the deck", async ({ page }) => {
    await page.goto("/decks/first-date");
    await expect(
      page.getByRole("heading", { level: 1, name: "First Date" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "A taste of the deck" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Start deck" }).click();
    await expect(page).toHaveURL(/\/play\/first-date$/);
    await page.getByRole("button", { name: "Quick start" }).click();
    await expect(page.getByText(/^Card 1 of \d+$/)).toBeVisible();
  });

  test("finishing the last card opens the end screen and clears the saved game", async ({
    page,
  }) => {
    await seedStorage(page, {
      extra: {
        progress: buildSavedProgress(
          "unravel",
          ["unravel-028", "unravel-029"],
          1
        ),
      },
    });
    await page.goto("/play/unravel");
    await expect(page.getByText(/^Card 2 of 2$/)).toBeVisible();
    await page.getByRole("button", { name: "Finish deck" }).click();

    await expect(page).toHaveURL(/\/play\/unravel\/done$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "You made it through Unravel",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Play again shuffled" })
    ).toBeVisible();
    expect(await readStoredText(page, "progress")).toBe("null");

    await page.goto("/decks");
    await expect(page.getByText("Pick up where you left off")).toHaveCount(0);
  });
});
