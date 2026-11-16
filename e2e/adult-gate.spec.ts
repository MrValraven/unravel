import { expect, test } from "@playwright/test";
import { readStoredText, seedStorage } from "./helpers";

test.describe("adult decks", () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page);
  });

  test("Go back keeps the preview open, and confirming leads to the boundaries check-in and play", async ({
    page,
  }) => {
    await page.goto("/decks");
    await page
      .getByRole("button", { name: "Flames of Desire", exact: true })
      .click();

    const previewSheet = page.getByRole("dialog", { name: "Flames of Desire" });
    await expect(previewSheet).toBeVisible();
    await previewSheet.getByRole("button", { name: "Start deck" }).click();

    const ageGate = page.getByRole("dialog", { name: "Adult content ahead" });
    await expect(ageGate).toBeVisible();
    await ageGate.getByRole("button", { name: "Go back" }).click();
    await expect(ageGate).toBeHidden();
    await expect(previewSheet).toBeVisible();
    await expect(page).toHaveURL(/\/decks$/);
    expect(await readStoredText(page, "ageConfirmed")).toBeNull();

    await previewSheet.getByRole("button", { name: "Start deck" }).click();
    await expect(ageGate).toBeVisible();
    await ageGate
      .getByRole("button", { name: "Confirm I'm 18 or older" })
      .click();

    await expect(page).toHaveURL(/\/play\/flames-of-desire$/);
    expect(await readStoredText(page, "ageConfirmed")).toBe("true");

    // No setup step: the check-in comes first, with Game options one tap away.
    await expect(
      page.getByRole("button", { name: "Game options" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Before you start" })
    ).toBeVisible();
    await expect(
      page.getByText("What is off the table tonight?")
    ).toBeVisible();
    await page.getByRole("button", { name: "Start deck", exact: true }).click();

    await expect(page.getByText(/^Card 1 of \d+$/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Pass", exact: true })
    ).toBeVisible();
  });

  test("opening an adult deck link directly asks for age and Go back returns to the decks", async ({
    page,
  }) => {
    await page.goto("/play/flames-of-desire");
    const ageGate = page.getByRole("dialog", { name: "Adult content ahead" });
    await expect(ageGate).toBeVisible();
    await ageGate.getByRole("button", { name: "Go back" }).click();
    await expect(page).toHaveURL(/\/decks$/);
  });

  test("the age confirmation is remembered for the next adult deck", async ({
    page,
  }) => {
    await seedStorage(page, { extra: { ageConfirmed: true } });
    await page.goto("/play/flames-of-desire");
    await expect(
      page.getByRole("dialog", { name: "Adult content ahead" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Before you start" })
    ).toBeVisible();
  });
});
