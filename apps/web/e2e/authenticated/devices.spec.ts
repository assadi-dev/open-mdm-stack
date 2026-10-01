import { expect, test, type Page } from "@playwright/test";
import { DATA_TABLE } from "@/constants/data-table";
import { DEVICE } from "@/constants/device";
import { STATUS } from "@/constants/status";

// Colonnes du tableau : 1 sélection · 2 appareil · 3 utilisateur · 4 groupe · 5 statut · 6 batterie · 7 contact · 8 actions.
const columnTexts = (page: Page, column: number) => page.locator(`tbody tr td:nth-child(${column})`).allInnerTexts();
const rowCount = (page: Page) => page.locator("tbody tr").count();

test.describe("appareils", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/devices");
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("affiche le titre et le nombre d'appareils enrôlés", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: DEVICE.page.title })).toBeVisible();
    await expect(page.getByText(DEVICE.page.subtitle.enrolled.many)).toBeVisible();
  });

  test("propose un onglet par statut avec son compteur", async ({ page }) => {
    for (const label of Object.values(DEVICE.tabs)) {
      await expect(page.getByRole("tab", { name: new RegExp(`^${label}\\s*\\d`) })).toBeVisible();
    }
  });

  test("liste huit appareils par page avec la pagination", async ({ page }) => {
    await expect(page.locator("tbody tr")).toHaveCount(8);
    await expect(page.getByRole("navigation", { name: DATA_TABLE.pagination.label })).toBeVisible();
    await expect(page.getByText(new RegExp(`${DATA_TABLE.pagination.range} .* ${DEVICE.pagination.items}$`))).toBeVisible();
  });

  test("filtre le tableau avec les onglets", async ({ page }) => {
    await page.getByRole("tab", { name: new RegExp(`^${DEVICE.tabs.offline}`) }).click();

    const statuses = await columnTexts(page, 5);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) expect(status).toContain(STATUS.offline.label);
  });

  test("filtre par groupe", async ({ page }) => {
    await page.getByRole("combobox", { name: DEVICE.filters.group.label }).click();
    const group = (await page.getByRole("option").nth(1).innerText()).trim();
    await page.getByRole("option", { name: group }).click();

    const groups = await columnTexts(page, 4);
    expect(groups.length).toBeGreaterThan(0);
    for (const cell of groups) expect(cell).toContain(group);
  });

  test("filtre par version d'Android", async ({ page }) => {
    const results = page.getByText(new RegExp(`${DEVICE.results.many}$`));
    const before = await results.innerText();

    await page.getByRole("combobox", { name: DEVICE.filters.android.label }).click();
    await page.getByRole("option").nth(1).click();

    await expect(results).not.toHaveText(before);
  });

  test("recherche un appareil par son numéro de série", async ({ page }) => {
    const [device = ""] = await columnTexts(page, 2);
    const serial = device.split(DEVICE.serialPrefix).at(-1)?.trim() ?? "";
    expect(serial).not.toBe("");

    await page.getByRole("searchbox", { name: DEVICE.filters.search.label }).fill(serial);

    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr")).toContainText(serial);
  });

  test("indique l'absence de résultat", async ({ page }) => {
    await page.getByRole("searchbox", { name: DEVICE.filters.search.label }).fill("zzzz");

    await expect(page.getByText(DATA_TABLE.empty)).toBeVisible();
    await expect(page.getByRole("navigation", { name: DATA_TABLE.pagination.label })).toHaveCount(0);
  });

  test("revient à la première page quand un filtre change", async ({ page }) => {
    const pageButton = (number: number) =>
      page.getByRole("button", { name: `${DATA_TABLE.pagination.page} ${number}`, exact: true });

    await pageButton(2).click();
    await expect(pageButton(2)).toHaveAttribute("aria-current", "page");

    await page.getByRole("tab", { name: new RegExp(`^${DEVICE.tabs.online}`) }).click();

    await expect(pageButton(1)).toHaveAttribute("aria-current", "page");
  });

  test("trie par appareil dans les deux sens", async ({ page }) => {
    const header = page.getByRole("columnheader", { name: DEVICE.table.device });
    const sortButton = page.getByRole("button", { name: DEVICE.table.device, exact: true });
    const firstDevice = async () => ((await columnTexts(page, 2))[0] ?? "").trim();

    await sortButton.click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    const ascending = await firstDevice();

    await sortButton.click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
    const descending = await firstDevice();

    expect(ascending.localeCompare(descending, "fr")).toBeLessThan(0);
  });

  test("sélectionne des lignes et affiche leur nombre", async ({ page }) => {
    const rowCheckboxes = page.getByRole("checkbox", { name: DATA_TABLE.selection.row });
    expect(await rowCount(page)).toBeGreaterThan(1);

    await rowCheckboxes.nth(0).check();
    await rowCheckboxes.nth(1).check();
    await expect(page.getByRole("status")).toContainText(`2 ${DATA_TABLE.selection.many}`);

    await page.getByRole("button", { name: DATA_TABLE.selection.clear }).click();
    await expect(page.getByRole("status")).toHaveCount(0);
  });
});
