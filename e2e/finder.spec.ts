import { expect, test } from "@playwright/test";
import { seedStorage } from "./helpers";

test.describe("deck finder", () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page);
  });

  test("three answers suggest decks, and Start deck on an adult deck asks for age first", async ({
    page,
  }) => {
    await page.goto("/finder");
    await expect(
      page.getByRole("heading", { level: 1, name: "Find a deck" })
    ).toBeVisible();

    await page.getByRole("button", { name: "My partner" }).click();
    await page.getByRole("button", { name: "Flirty" }).click();
    await page.getByRole("button", { name: "Adults only (18+)" }).click();

    await expect(
      page.getByRole("heading", { name: "Try one of these" })
    ).toBeVisible();
    const startFlames = page.getByRole("button", {
      name: "Start deck: Flames of Desire",
    });
    await expect(startFlames).toHaveText("Start deck");
    await startFlames.click();

    const ageGate = page.getByRole("dialog", { name: "Adult content ahead" });
    await expect(ageGate).toBeVisible();
    await ageGate
      .getByRole("button", { name: "Confirm I'm 18 or older" })
      .click();
    await expect(page).toHaveURL(/\/play\/flames-of-desire$/);
  });
});
