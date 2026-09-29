import { test as setup } from "@playwright/test";
import { AUTH_FILE, getCredentials, login } from "./support/auth";

setup("se connecter", async ({ page }) => {
  await login(page, getCredentials());
  await page.context().storageState({ path: AUTH_FILE });
});
