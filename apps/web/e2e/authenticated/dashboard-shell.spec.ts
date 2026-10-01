import { expect, test } from "@playwright/test";
import { DASHBOARD } from "@/constants/dashboard";
import { NAVIGATION } from "@/constants/navigation";

test.describe("shell du tableau de bord", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("affiche le titre de la page dans l'en-tête", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: DASHBOARD.page.title })).toBeVisible();
  });

  test("marque le tableau de bord comme page courante dans la sidebar", async ({ page }) => {
    const link = page.getByRole("link", { name: NAVIGATION.main[0]?.label });

    await expect(link).toHaveAttribute("aria-current", "page");
  });

  test("désactive les pages qui ne sont pas encore construites", async ({ page }) => {
    for (const item of [...NAVIGATION.main, ...NAVIGATION.admin].filter(({ enabled }) => !enabled)) {
      await expect(page.getByRole("button", { name: item.label })).toBeDisabled();
    }
  });

  test("affiche l'état du broker MQTT", async ({ page }) => {
    await expect(page.getByText(NAVIGATION.broker.title)).toBeVisible();
  });
});
