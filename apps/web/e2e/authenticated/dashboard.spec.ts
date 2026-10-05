import { expect, test } from "@playwright/test";
import { DASHBOARD } from "@/constants/dashboard";
import { DATA_TABLE } from "@/constants/data-table";
import { DEVICE } from "@/constants/device";

test.describe("tableau de bord", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  // Le sous-titre vient du parc réel (appareils hors ligne ou en attente) : aucun, un seul ou plusieurs.
  test("affiche la salutation et le nombre d'appareils à surveiller", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(DASHBOARD.page.greeting);
    await expect(page.getByText(/attention aujourd/)).toBeVisible();
  });

  test("affiche les quatre indicateurs", async ({ page }) => {
    for (const { label } of Object.values(DASHBOARD.kpi)) {
      await expect(page.locator('[data-slot="card"]').filter({ hasText: label })).toBeVisible();
    }
  });

  test("affiche les trois graphes avec un résumé accessible", async ({ page }) => {
    for (const label of [DASHBOARD.flow.chartLabel, DASHBOARD.compliance.chartLabel, DASHBOARD.android.chartLabel]) {
      await expect(page.getByRole("img", { name: new RegExp(label) })).toBeVisible();
    }
  });

  test.describe("table des appareils récents", () => {
    const recentCard = (page: import("@playwright/test").Page) =>
      page.locator('[data-slot="card"]').filter({ hasText: DASHBOARD.recent.title });

    test("liste les appareils sans pagination", async ({ page }) => {
      await expect(recentCard(page).locator("tbody tr")).toHaveCount(6);
      await expect(recentCard(page).getByRole("navigation")).toHaveCount(0);
    });

    test("filtre les lignes avec la recherche de l'en-tête de carte", async ({ page }) => {
      const card = recentCard(page);
      await card.getByRole("searchbox", { name: DATA_TABLE.search.label }).fill("terrain");

      const groups = await card.locator("tbody tr td:nth-child(3)").allInnerTexts();
      expect(groups.length).toBeGreaterThan(0);
      expect(groups.length).toBeLessThan(6);
      for (const group of groups) expect(group).toMatch(/terrain/i);
    });

    test("trie par appareil dans les deux sens", async ({ page }) => {
      const card = recentCard(page);
      const header = card.getByRole("columnheader", { name: DEVICE.table.device });
      const firstDevice = async () => (await card.locator("tbody tr td:nth-child(1)").first().innerText()).trim();

      await card.getByRole("button", { name: DEVICE.table.device, exact: true }).click();
      await expect(header).toHaveAttribute("aria-sort", "ascending");
      const ascending = await firstDevice();

      await card.getByRole("button", { name: DEVICE.table.device, exact: true }).click();
      await expect(header).toHaveAttribute("aria-sort", "descending");
      const descending = await firstDevice();

      expect(ascending.localeCompare(descending, "fr")).toBeLessThan(0);
    });

    test("propose de voir le détail depuis le menu d'une ligne", async ({ page }) => {
      await recentCard(page).getByRole("button", { name: new RegExp(DEVICE.actionsFor) }).first().click();

      await expect(page.getByRole("menuitem", { name: DEVICE.button.viewDetail })).toBeVisible();
    });
  });
});
