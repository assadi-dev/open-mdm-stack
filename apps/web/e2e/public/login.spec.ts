import { expect, test } from "@playwright/test";
import { ACTION_LABELS } from "@/constants/actions";

test.describe("page de connexion", () => {
  test("affiche le formulaire de connexion", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/Connexion/);
    await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
    await expect(page.getByLabel("Mot de passe", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: ACTION_LABELS.login })).toBeVisible();
  });

  test("redirige un visiteur non connecté du tableau de bord vers la connexion", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
  });
});
