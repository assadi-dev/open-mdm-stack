import { expect, test, type Page } from "@playwright/test";
import { ACTION_LABELS } from "@/constants/actions";
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

// Le bouton « Filtrer » : son badge porte le nombre de valeurs appliquées, il faut donc le chercher par son début.
const filterButton = (page: Page) => page.getByRole("button", { name: new RegExp(`^${DEVICE.button.filter}`) });
const openFilter = async (page: Page) => {
  await filterButton(page).click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByText(DATA_TABLE.filter.title)).toBeVisible();
  return panel;
};

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

  test("ouvre le panneau de filtres : marque, modèle, version d'Android et un groupe grisé", async ({ page }) => {
    const panel = await openFilter(page);

    for (const { label } of [DEVICE.filters.brand, DEVICE.filters.model, DEVICE.filters.android]) {
      await expect(panel.getByRole("combobox", { name: label })).toBeEnabled();
    }
    await expect(panel.getByRole("combobox", { name: new RegExp(`^${DEVICE.filters.group.label}`) })).toBeDisabled();
    await expect(panel.getByText(DEVICE.filters.group.soon)).toBeVisible();
  });

  test("filtre par version d'Android, à « Appliquer »", async ({ page }) => {
    const panel = await openFilter(page);

    await panel.getByRole("combobox", { name: DEVICE.filters.android.label }).click();
    await page.getByRole("option", { name: new RegExp(`^${DEVICE.filters.android.version} `) }).first().click();
    await expect(page).not.toHaveURL(/sdkVersion=/);

    await panel.getByRole("button", { name: DATA_TABLE.filter.apply }).click();

    await expect(page).toHaveURL(/sdkVersion=\d+/);
    await expect(panel).toBeHidden();
    await expect(filterButton(page).getByText("1", { exact: true })).toBeVisible();
  });

  test("filtre par marque", async ({ page }) => {
    const panel = await openFilter(page);

    await panel.getByRole("combobox", { name: DEVICE.filters.brand.label }).click();
    await page.getByRole("option").nth(1).click();
    await panel.getByRole("button", { name: DATA_TABLE.filter.apply }).click();

    await expect(page).toHaveURL(/brand=[^&]+/);
    expect(await rowCount(page)).toBeGreaterThan(0);
  });

  test("réinitialise les filtres du panneau sans toucher à l'onglet", async ({ page }) => {
    await page.getByRole("tab", { name: new RegExp(`^${DEVICE.tabs.online}`) }).click();
    const panel = await openFilter(page);
    await panel.getByRole("combobox", { name: DEVICE.filters.model.label }).click();
    await page.getByRole("option").nth(1).click();
    await panel.getByRole("button", { name: DATA_TABLE.filter.apply }).click();
    await expect(page).toHaveURL(/model=[^&]+/);

    await (await openFilter(page)).getByRole("button", { name: DATA_TABLE.filter.reset }).click();

    await expect(page).not.toHaveURL(/model=/);
    await expect(page).toHaveURL(/status=/);
  });

  test("masque et réaffiche une colonne avec le bouton « Colonnes »", async ({ page }) => {
    const hideable = [DEVICE.table.model, DEVICE.table.user, DEVICE.table.status, DEVICE.table.battery, DEVICE.table.lastContact];
    const header = (name: string) => page.getByRole("columnheader", { name });

    await page.getByRole("button", { name: DATA_TABLE.columns.button }).click();
    const items = page.getByRole("menuitemcheckbox");
    // Tout est coché au départ ; l'appareil et les actions ne se masquent pas.
    await expect(items).toHaveCount(hideable.length);
    for (const name of hideable) await expect(page.getByRole("menuitemcheckbox", { name })).toBeChecked();

    await page.getByRole("menuitemcheckbox", { name: DEVICE.table.battery }).click();
    await expect(header(DEVICE.table.battery)).toHaveCount(0);
    await expect(header(DEVICE.table.model)).toBeVisible();
    // Le menu reste ouvert pendant qu'on coche.
    await expect(items.first()).toBeVisible();

    await page.getByRole("menuitemcheckbox", { name: DEVICE.table.battery }).click();
    await expect(header(DEVICE.table.battery)).toBeVisible();
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
    await expect(page.getByRole("toolbar")).toContainText(`2 ${DATA_TABLE.selection.many}`);

    await page.getByRole("button", { name: DATA_TABLE.selection.clear }).click();
    await expect(page.getByRole("toolbar")).toHaveCount(0);
  });

  test("propose les actions d'un appareil dans son menu", async ({ page }) => {
    await page.getByRole("button", { name: new RegExp(`^${DEVICE.actionsFor} `) }).first().click();

    await expect(page.getByRole("menuitem")).toHaveText([
      DEVICE.button.viewDetail,
      DEVICE.button.refresh,
      DEVICE.button.update,
      DEVICE.button.delete,
    ]);
  });

  // La boîte de modification, ouverte depuis le menu de la première ligne. Aucun de ces tests n'enregistre : les données restent intactes.
  const openUpdateDialog = async (page: Page) => {
    await page.getByRole("button", { name: new RegExp(`^${DEVICE.actionsFor} `) }).first().click();
    await page.getByRole("menuitem", { name: DEVICE.button.update }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(DEVICE.dialog.update.title)).toBeVisible();
    return dialog;
  };

  test("ouvre le formulaire de modification avec son seul champ, le nom", async ({ page }) => {
    const dialog = await openUpdateDialog(page);

    await expect(dialog.getByLabel(DEVICE.form.name.label, { exact: false }).first()).toBeVisible();
    await expect(dialog.getByRole("textbox")).toHaveCount(1);

    await dialog.getByRole("button", { name: ACTION_LABELS.cancel }).click();
    await expect(dialog).toBeHidden();
  });

  test("refuse un nom de plus de 100 caractères, sans envoyer", async ({ page }) => {
    const dialog = await openUpdateDialog(page);

    await dialog.getByLabel(DEVICE.form.name.label, { exact: false }).first().fill("x".repeat(101));
    await dialog.getByRole("button", { name: DEVICE.dialog.update.submit }).click();

    await expect(dialog.getByText(DEVICE.validation.nameTooLong)).toBeVisible();
    await expect(page.getByText(DEVICE.success.update)).toHaveCount(0);
  });

  // Ces tests annulent la confirmation : aucun appareil n'est supprimé ni bloqué.
  test("demande confirmation avant de supprimer un appareil, et le garde si on annule", async ({ page }) => {
    const rows = await rowCount(page);
    await page.getByRole("button", { name: new RegExp(`^${DEVICE.actionsFor} `) }).first().click();
    await page.getByRole("menuitem", { name: DEVICE.button.delete }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(DEVICE.dialog.delete.description);
    await dialog.getByRole("button", { name: ACTION_LABELS.cancel }).click();

    await expect(dialog).toBeHidden();
    expect(await rowCount(page)).toBe(rows);
  });

  test("demande confirmation avant de supprimer la sélection, et la garde si on annule", async ({ page }) => {
    const rowCheckboxes = page.getByRole("checkbox", { name: DATA_TABLE.selection.row });
    await rowCheckboxes.nth(0).check();
    await rowCheckboxes.nth(1).check();
    await page.getByRole("toolbar").getByRole("button", { name: DEVICE.button.deleteMany }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(DEVICE.dialog.deleteMany.description);
    await dialog.getByRole("button", { name: ACTION_LABELS.cancel }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("toolbar")).toContainText(`2 ${DATA_TABLE.selection.many}`);
  });

  test("demande confirmation avant de bloquer un appareil, et le laisse si on annule", async ({ page }) => {
    await page.getByRole("button", { name: new RegExp(`^${DEVICE.actionsFor} `) }).first().click();
    await page.getByRole("menuitem", { name: DEVICE.button.block }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(DEVICE.dialog.block.description);
    await dialog.getByRole("button", { name: ACTION_LABELS.cancel }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(DEVICE.success.block)).toHaveCount(0);
  });

  test("demande confirmation avant de bloquer la sélection, et la garde si on annule", async ({ page }) => {
    const rowCheckboxes = page.getByRole("checkbox", { name: DATA_TABLE.selection.row });
    await rowCheckboxes.nth(0).check();
    await rowCheckboxes.nth(1).check();
    await page.getByRole("toolbar").getByRole("button", { name: DEVICE.button.blockMany }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(DEVICE.dialog.blockMany.description);
    await dialog.getByRole("button", { name: ACTION_LABELS.cancel }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("toolbar")).toContainText(`2 ${DATA_TABLE.selection.many}`);
  });

  test("propose d'actualiser, de bloquer ou de supprimer les appareils sélectionnés", async ({ page }) => {
    await page.getByRole("checkbox", { name: DATA_TABLE.selection.row }).first().check();

    const bar = page.getByRole("toolbar");
    await expect(bar.getByRole("button", { name: DEVICE.button.refreshMany })).toBeVisible();
    await expect(bar.getByRole("button", { name: DEVICE.button.blockMany })).toBeVisible();
    await expect(bar.getByRole("button", { name: DEVICE.button.deleteMany })).toBeVisible();
  });
});
