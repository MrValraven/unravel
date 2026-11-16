import { expect, test } from "@playwright/test";
import { readCopiedLinks, recordSharedLinks, seedStorage } from "./helpers";

const DECK_TITLE = "Friday crew";
const CARD_TEXT = "What made you laugh this week?";

test.describe("custom decks", () => {
  test("creates a deck, shares its link and imports it from the link in a new page", async ({
    context,
    page,
  }) => {
    await seedStorage(page);
    await recordSharedLinks(page);

    await page.goto("/decks");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Create a deck" })
      .click();
    await expect(page).toHaveURL(/\/custom\/new$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "New deck" })
    ).toBeVisible();

    await page.getByLabel("Deck title").fill(DECK_TITLE);
    await page.getByLabel("Card 1", { exact: true }).fill(CARD_TEXT);
    await page.getByRole("button", { name: "Save deck" }).click();

    await expect(page).toHaveURL(/\/custom$/);
    await expect(
      page.getByText(`Saved ${DECK_TITLE} to your decks`)
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: DECK_TITLE })
    ).toBeVisible();

    await page
      .getByRole("button", { name: `Share a link to ${DECK_TITLE}` })
      .click();
    await expect(
      page.getByText(`Link copied. Paste it anywhere to share ${DECK_TITLE}`)
    ).toBeVisible();
    const [sharedLink] = await readCopiedLinks(page);
    expect(sharedLink).toContain("/custom/import#d=");

    const importPage = await context.newPage();
    await importPage.goto(sharedLink ?? "");
    await expect(
      importPage.getByText("Someone shared a deck with you")
    ).toBeVisible();
    await expect(
      importPage.getByRole("heading", { level: 2, name: DECK_TITLE })
    ).toBeVisible();
    await expect(importPage.getByText(CARD_TEXT)).toBeVisible();
    await importPage.getByRole("button", { name: "Save to my decks" }).click();

    await expect(importPage).toHaveURL(/\/custom$/);
    await expect(
      importPage
        .getByRole("list", { name: "Your custom decks" })
        .getByRole("listitem")
    ).toHaveCount(2);
  });

  test("a saved custom deck can be played from its list", async ({ page }) => {
    await seedStorage(page);
    await page.goto("/custom/new");
    await page.getByLabel("Deck title").fill(DECK_TITLE);
    await page.getByLabel("Card 1", { exact: true }).fill(CARD_TEXT);
    const cardType = page.getByRole("group", { name: "Card 1 type" });
    await expect(
      cardType.getByRole("radio", { name: "Question" })
    ).toBeChecked();
    // Arrow keys move through the types and choose as they go, like any radio group.
    await cardType.getByRole("radio", { name: "Question" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      cardType.getByRole("radio", { name: "Challenge" })
    ).toBeChecked();
    await cardType.getByRole("radio", { name: "Everyone" }).check();
    await expect(
      cardType.getByRole("radio", { name: "Everyone" })
    ).toBeChecked();
    await page.getByRole("button", { name: "Save deck" }).click();

    const startCustomDeck = page.getByRole("link", {
      name: `Start deck ${DECK_TITLE}`,
    });
    await expect(startCustomDeck).toHaveText("Start deck");
    await startCustomDeck.click();
    await expect(page.getByText(/^Card 1 of 1$/)).toBeVisible();
    await expect(page.getByText(CARD_TEXT).first()).toBeVisible();
  });

  test("saving an empty deck names what is missing", async ({ page }) => {
    await seedStorage(page);
    await page.goto("/custom/new");
    await page.getByRole("button", { name: "Save deck" }).click();
    await expect(page.getByText("Give the deck a title")).toBeVisible();
    await expect(page.getByText("Write this card or delete it")).toBeVisible();
    await expect(page).toHaveURL(/\/custom\/new$/);
  });

  test("a damaged share link says why it did not open", async ({ page }) => {
    await seedStorage(page);
    await page.goto("/custom/import#d=not-a-real-deck!");
    await expect(
      page.getByRole("heading", { name: "This link did not open a deck" })
    ).toBeVisible();
  });
});
