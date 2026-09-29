import { expect, test } from "@playwright/test";
import { ACTION_LABELS } from "@/constants/actions";
import { SUCCESS_AUTH_MESSAGES } from "@/constants/success";
import { getCredentials, login } from "../support/auth";

// Session dédiée : la déconnexion supprime la session côté serveur, elle ne doit pas casser le storageState partagé.
test.use({ storageState: { cookies: [], origins: [] } });

test("se déconnecter ramène à la page de connexion", async ({ page }) => {
  await login(page, getCredentials());

  await page.getByRole("button", { name: ACTION_LABELS.logout }).click();

  await expect(page.getByText(SUCCESS_AUTH_MESSAGES.logout)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
