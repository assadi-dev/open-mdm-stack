import path from "node:path";
import type { Page } from "@playwright/test";
import { ACTION_LABELS } from "@/constants/actions";

export const AUTH_FILE = path.resolve(import.meta.dirname, "../.auth/user.json");

type Credentials = {
  email: string;
  password: string;
};

export const getCredentials = (): Credentials => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("Définissez E2E_USER_EMAIL et E2E_USER_PASSWORD dans apps/web/.env.e2e (voir e2e/README.md).");
  }

  return { email, password };
};

export const login = async (page: Page, { email, password }: Credentials) => {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: ACTION_LABELS.login }).click();
  await page.waitForURL("**/dashboard");
};
