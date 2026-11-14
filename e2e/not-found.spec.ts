import { expect, test } from "@playwright/test";
import { seedStorage } from "./helpers";

test.describe("not found", () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page);
  });

  test("an unknown path shows the not found page with a way back to the decks", async ({
    page,
  }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(
      page.getByRole("heading", { level: 1, name: "This page wandered off" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to decks" }).click();
    await expect(page).toHaveURL(/\/decks$/);
  });

  test("an unknown deck id shows the not found page", async ({ page }) => {
    await page.goto("/decks/no-such-deck");
    await expect(
      page.getByRole("heading", { level: 1, name: "This page wandered off" })
    ).toBeVisible();
  });

  test("old paths redirect to their new homes", async ({ page }) => {
    await page.goto("/questions");
    await expect(page).toHaveURL(/\/decks$/);
    await page.goto("/reminder");
    await expect(page).toHaveURL(/\/about$/);
  });
});
