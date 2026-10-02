import { expect, test, type Page } from "@playwright/test";
import { DATA_TABLE } from "@/constants/data-table";
import { DEVICE } from "@/constants/device";
import { STATUS } from "@/constants/status";

// Colonnes du tableau : 1 sélection · 2 appareil · 3 modèle · 4 utilisateur · 5 statut · 6 batterie · 7 contact · 8 actions.
const columnTexts = (page: Page, column: number) => page.locator(`tbody tr td:nth-child(${column})`).allInnerTexts();
const rowCount = (page: Page) => page.locator("tbody tr").count();
// L'URL garde le tri au format de l'API (`sort=-lastHeartbeatAt,-presenceChangedAt`), la virgule peut y être encodée.
const currentUrl = (page: Page) => decodeURIComponent(page.url());
const pageButton = (page: Page, number: number) =>
  page.getByRole("button", { name: `${DATA_TABLE.pagination.page} ${number}`, exact: true });

// Le tri, la recherche et les filtres sont ceux de l'API : le tableau garde ses lignes le temps de la réponse, on attend donc le résultat.
const allRowsMatch = (page: Page, column: number, text: string) =>
  expect
    .poll(async () => {
      const texts = await columnTexts(page, column);
      return texts.length > 0 && texts.every((cell) => cell.includes(text));
    })
    .toBe(true);

test.describe("appareils", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/devices");
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("affiche le titre et le nombre d'appareils enrôlés", async ({ page }) => {
    const { one, many } = DEVICE.page.subtitle.enrolled;

    await expect(page.getByRole("heading", { level: 1, name: DEVICE.page.title })).toBeVisible();
    await expect(page.getByText(new RegExp(`^\\d.* (${one}|${many}) · \\d.* ${DEVICE.page.subtitle.online}$`))).toBeVisible();
  });

  test("propose un onglet par statut avec son compteur", async ({ page }) => {
    for (const label of Object.values(DEVICE.tabs)) {
      await expect(page.getByRole("tab", { name: new RegExp(`^${label}\\s*\\d`) })).toBeVisible();
    }
  });

  test("liste au plus huit appareils par page", async ({ page }) => {
    expect(await rowCount(page)).toBeGreaterThan(0);
    expect(await rowCount(page)).toBeLessThanOrEqual(8);
  });

  test("filtre le tableau avec les onglets", async ({ page }) => {
    await page.getByRole("tab", { name: new RegExp(`^${DEVICE.tabs.offline}`) }).click();

    await expect(page).toHaveURL(/status=offline/);
    await allRowsMatch(page, 5, STATUS.offline.label);
  });

  test("filtre par version d'Android", async ({ page }) => {
    const results = page.getByText(new RegExp(`${DEVICE.results.many}$`));
    const before = await results.innerText();

    await page.getByRole("combobox", { name: DEVICE.filters.android.label }).click();
    await page.getByRole("option").nth(1).click();

    await expect(page).toHaveURL(/sdkVersion=\d+/);
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
    test.skip((await pageButton(page, 2).count()) === 0, "Il faut plus d'une page d'appareils.");

    await pageButton(page, 2).click();
    await expect(pageButton(page, 2)).toHaveAttribute("aria-current", "page");

    await page.getByRole("tab", { name: new RegExp(`^${DEVICE.tabs.online}`) }).click();

    await expect(pageButton(page, 1)).toHaveAttribute("aria-current", "page");
  });

  test("trie par appareil dans les deux sens", async ({ page }) => {
    const header = page.getByRole("columnheader", { name: DEVICE.table.device });
    const sortButton = page.getByRole("button", { name: DEVICE.table.device, exact: true });
    const firstDevice = async () => ((await columnTexts(page, 2))[0] ?? "").trim();

    await sortButton.click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await expect(page).toHaveURL(/sort=displayName(&|$)/);
    // Le tri est celui de l'API : on attend que les lignes changent avant de comparer.
    const ascendingFirst = await firstDevice();

    await sortButton.click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
    await expect(page).toHaveURL(/sort=-displayName(&|$)/);
    await expect.poll(firstDevice).not.toBe(ascendingFirst);

    expect(ascendingFirst.localeCompare(await firstDevice(), "fr")).toBeLessThan(0);
  });

  test("trie par dernier contact sur le heartbeat puis sur la présence", async ({ page }) => {
    const sortButton = page.getByRole("button", { name: DEVICE.table.lastContact, exact: true });

    await sortButton.click();
    await expect.poll(() => currentUrl(page)).toContain("sort=-lastHeartbeatAt,-presenceChangedAt");

    await sortButton.click();
    await expect.poll(() => currentUrl(page)).toContain("sort=lastHeartbeatAt,presenceChangedAt");
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
