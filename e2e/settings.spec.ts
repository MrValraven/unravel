import { expect, test } from "@playwright/test";
import { seedStorage } from "./helpers";

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

  test("dim mode persists across a reload", async ({ page }) => {
    await page.goto("/settings");
    const dimSwitch = page.getByRole("switch", { name: "Dim mode" });
    await expect(dimSwitch).toHaveAttribute("aria-checked", "false");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "default");

    await dimSwitch.click();
    await expect(dimSwitch).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dim");

    await page.reload();
    await expect(
      page.getByRole("switch", { name: "Dim mode" })
    ).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dim");
  });
});
