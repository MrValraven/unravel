import { expect, test } from "@playwright/test";
import { seedStorage, unravelCardIds } from "./helpers";

test.describe("favourites", () => {
  test("starring a card marks it and lowers the number of stars still needed", async ({
    page,
  }) => {
    await seedStorage(page);
    await page.goto("/play/unravel");

    const starButton = page.getByRole("button", {
      name: "Save card to favourites",
    });
    await expect(starButton).toHaveAttribute("aria-pressed", "false");
    await starButton.click();
    await expect(starButton).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("link", { name: "Back to decks" }).click();
    await expect(page).toHaveURL(/\/decks$/);
    await expect(
      page.getByText(
        "Star 4 more cards while you play to build your favourites deck."
      )
    ).toBeVisible();
  });

  test("the fifth star builds the favourites deck in the picker", async ({
    page,
  }) => {
    await seedStorage(page, { extra: { favourites: unravelCardIds.slice(1) } });
    await page.goto("/play/unravel");

    const starButton = page.getByRole("button", {
      name: "Save card to favourites",
    });
    await expect(starButton).toHaveAttribute("aria-pressed", "false");
    await starButton.click();
    await expect(starButton).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("link", { name: "Back to decks" }).click();
    await expect(
      page.getByText(/Star \d+ more cards? while you play/)
    ).toHaveCount(0);
    const favouritesDeck = page.getByRole("button", {
      name: "Your favourites",
      exact: true,
    });
    await expect(favouritesDeck).toBeVisible();
    await expect(favouritesDeck).toHaveAccessibleDescription(/5 cards/);
  });
});
