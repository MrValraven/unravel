import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { buildSavedProgress, seedStorage, unravelCardIds } from "./helpers";

const BLOCKING_IMPACTS = ["serious", "critical"];

/** Runs axe against the current page and returns the violations that block release. */
const findBlockingViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations
    .filter((violation) => BLOCKING_IMPACTS.includes(violation.impact ?? ""))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(" ")),
    }));
};

test.describe("accessibility scans", () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page, {
      extra: { progress: buildSavedProgress("unravel", unravelCardIds, 0) },
    });
  });

  test("home has no serious or critical violations", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Unravel" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Card of the day" })
    ).toBeVisible();
    expect(await findBlockingViolations(page)).toEqual([]);
  });

  test("decks has no serious or critical violations", async ({ page }) => {
    await page.goto("/decks");
    await expect(
      page.getByRole("heading", { level: 1, name: "Decks" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Unravel", exact: true })
    ).toBeVisible();
    expect(await findBlockingViolations(page)).toEqual([]);
  });

  test("the deck preview sheet has no serious or critical violations", async ({
    page,
  }) => {
    await page.goto("/decks");
    await page.getByRole("button", { name: "Unravel", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Unravel" })).toBeVisible();
    expect(await findBlockingViolations(page)).toEqual([]);
  });

  test("a play screen has no serious or critical violations", async ({
    page,
  }) => {
    await page.goto("/play/unravel");
    await expect(page.getByText(/^Card 1 of \d+$/)).toBeVisible();
    expect(await findBlockingViolations(page)).toEqual([]);
  });

  test("settings has no serious or critical violations", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { level: 1, name: "Settings" })
    ).toBeVisible();
    expect(await findBlockingViolations(page)).toEqual([]);
  });
});
