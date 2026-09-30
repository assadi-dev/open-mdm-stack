import { expect, test, type Page } from "@playwright/test";
import { ACTION_LABELS } from "@/constants/actions";
import { WIFI_NETWORK } from "@/constants/wifi-network";

// Colonnes du tableau : 1 sélection · 2 réseau · 3 sécurité · 4 mot de passe · 5 date de création · 6 actions.
const columnTexts = (page: Page, column: number) => page.locator(`tbody tr td:nth-child(${column})`).allInnerTexts();
const rowCount = (page: Page) => page.locator("tbody tr").count();
const dialog = (page: Page) => page.getByRole("alertdialog");
// `exact` : « Mot de passe » est aussi contenu dans le libellé du bouton « Afficher le mot de passe ».
const passwordField = (page: Page) => dialog(page).getByLabel(WIFI_NETWORK.form.password.label, { exact: true });

const openRowMenu = async (page: Page, ssid: string, item: string) => {
  await page.getByRole("button", { name: `${WIFI_NETWORK.actionsFor} ${ssid}` }).click();
  await page.getByRole("menuitem", { name: item }).click();
};

const addNetwork = async (page: Page, ssid: string, password: string) => {
  await page.getByRole("button", { name: WIFI_NETWORK.button.create }).click();
  await dialog(page).getByLabel(WIFI_NETWORK.form.ssid.label).fill(ssid);
  await passwordField(page).fill(password);
  await dialog(page).getByRole("button", { name: WIFI_NETWORK.dialog.create.submit }).click();
};

test.describe("réseaux Wi-Fi", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wifi-networks");
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("affiche le titre, le nombre de réseaux et d'appareils connectés", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: WIFI_NETWORK.page.title })).toBeVisible();

    // Le titre de section « Réseaux enregistrés » contient les mêmes mots : on cible le sous-titre par son ancrage numérique.
    const subtitle = page.getByText(new RegExp(`^\\d+ ${WIFI_NETWORK.page.subtitle.registered.many} · `));
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText(WIFI_NETWORK.page.subtitle.connected.many);
  });

  test("explique la distribution automatique des réseaux", async ({ page }) => {
    const notice = page.getByRole("note");

    await expect(notice).toContainText(WIFI_NETWORK.notice.title);
    await expect(notice).toContainText(WIFI_NETWORK.notice.description);
  });

  test("liste les réseaux avec leur sécurité et un mot de passe masqué", async ({ page }) => {
    await expect(page.locator("tbody tr")).toHaveCount(4);
    await expect(page.getByRole("img", { name: WIFI_NETWORK.passwordMasked })).toHaveCount(4);
    expect(await columnTexts(page, 3)).toEqual(expect.arrayContaining([WIFI_NETWORK.security.WPA2, WIFI_NETWORK.security.WPA3]));
  });

  test("signale un réseau chiffré par un protocole hérité", async ({ page }) => {
    const legacy = page.locator("tbody tr", { hasText: WIFI_NETWORK.flags.legacy });

    await expect(legacy).toHaveCount(1);
    await expect(legacy).toContainText(WIFI_NETWORK.security.WEP);
  });

  test("recherche un réseau par son nom", async ({ page }) => {
    await page.getByRole("searchbox", { name: WIFI_NETWORK.filters.search.label }).fill("lyon");

    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByText(`1 ${WIFI_NETWORK.results.one}`)).toBeVisible();
  });

  test("trie les réseaux par date de création", async ({ page }) => {
    const sortByDate = page.getByRole("button", { name: new RegExp(`^${WIFI_NETWORK.table.createdAt}`) });

    await sortByDate.click();
    const descending = await columnTexts(page, 5);
    await sortByDate.click();
    const ascending = await columnTexts(page, 5);

    expect(ascending).toEqual([...descending].reverse());
  });

  test("valide le formulaire d'ajout sans l'envoyer", async ({ page }) => {
    await page.getByRole("button", { name: WIFI_NETWORK.button.create }).click();
    await dialog(page).getByRole("button", { name: WIFI_NETWORK.dialog.create.submit }).click();

    await expect(dialog(page).getByText(WIFI_NETWORK.validation.ssidRequired)).toBeVisible();
    await expect(dialog(page).getByText(WIFI_NETWORK.validation.passwordTooShort)).toBeVisible();
    expect(await rowCount(page)).toBe(4);
  });

  test("désactive le mot de passe d'un réseau ouvert", async ({ page }) => {
    await page.getByRole("button", { name: WIFI_NETWORK.button.create }).click();
    await dialog(page).getByRole("combobox", { name: WIFI_NETWORK.form.security.label }).click();
    await page.getByRole("option", { name: WIFI_NETWORK.security.NONE }).click();

    await expect(passwordField(page)).toBeDisabled();
  });

  test("ajoute un réseau", async ({ page }) => {
    await addNetwork(page, "Atelier-Sud", "motdepasse-atelier");

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText(WIFI_NETWORK.success.create)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(5);
    await expect(page.locator("tbody tr").first()).toContainText("Atelier-Sud");
  });

  test("modifie un réseau", async ({ page }) => {
    await openRowMenu(page, "Terrain-Lyon", WIFI_NETWORK.button.update);
    await expect(dialog(page).getByLabel(WIFI_NETWORK.form.ssid.label)).toHaveValue("Terrain-Lyon");

    await dialog(page).getByLabel(WIFI_NETWORK.form.ssid.label).fill("Terrain-Paris");
    await dialog(page).getByRole("button", { name: WIFI_NETWORK.dialog.update.submit }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText(WIFI_NETWORK.success.update)).toBeVisible();
    await expect(page.getByText("Terrain-Paris")).toBeVisible();
    await expect(page.getByText("Terrain-Lyon")).toHaveCount(0);
  });

  test("garde le réseau quand on annule la suppression", async ({ page }) => {
    await openRowMenu(page, "Siège-Corp", WIFI_NETWORK.button.delete);
    await expect(dialog(page)).toContainText(WIFI_NETWORK.dialog.delete.description);
    await dialog(page).getByRole("button", { name: ACTION_LABELS.cancel }).click();

    await expect(dialog(page)).toBeHidden();
    expect(await rowCount(page)).toBe(4);
  });

  test("supprime un réseau après confirmation", async ({ page }) => {
    await openRowMenu(page, "Siège-Corp", WIFI_NETWORK.button.delete);
    await expect(dialog(page)).toContainText("Siège-Corp");
    await expect(dialog(page)).toContainText("irréversible");
    await dialog(page).getByRole("button", { name: WIFI_NETWORK.dialog.delete.submit }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText(WIFI_NETWORK.success.delete)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(3);
    await expect(page.getByText("Siège-Corp")).toHaveCount(0);
  });
});
