import { expect, test } from "@playwright/test";
import { ENROLLMENT } from "@/constants/enrollment";

// Les données viennent des mocks de la page (`enrollment/_mocks`) : QR code, code « 482 913 » et Pixel 8 branché en USB.
const PAGE_URL = "/enrollment";

test.describe("enrôlement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.getByRole("heading", { level: 1, name: ENROLLMENT.page.title })).toBeVisible();
  });

  test("ouvre la méthode QR code par défaut, avec les réglages du serveur", async ({ page }) => {
    await expect(page.getByRole("tab", { name: ENROLLMENT.methods.qr.tab })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(ENROLLMENT.methods.qr.subtitle)).toBeVisible();
    await expect(page.getByRole("img", { name: ENROLLMENT.qr.alt })).toBeVisible();
    await expect(page.getByLabel(ENROLLMENT.config.namePattern.label)).toHaveValue("Terrain-Lyon-{n}");
    await expect(page.getByLabel(ENROLLMENT.config.group.label)).toContainText("Terrain Lyon");
    await expect(page.getByLabel(new RegExp(ENROLLMENT.config.wifi.label))).toContainText(ENROLLMENT.config.wifi.none);
  });

  test("refuse une URL d'agent invalide, puis régénère le QR code après réinitialisation", async ({ page }) => {
    const apkUrl = page.getByLabel(new RegExp(ENROLLMENT.config.apkUrl.label));
    const regenerate = page.getByRole("button", { name: ENROLLMENT.button.regenerateQr });

    await apkUrl.fill("pas-une-url");
    await regenerate.click();
    await expect(page.getByText(ENROLLMENT.validation.apkUrlInvalid)).toBeVisible();

    await page.getByRole("button", { name: ENROLLMENT.button.reset }).click();
    await expect(apkUrl).toHaveValue("");
    await regenerate.click();
    await expect(page.getByText(ENROLLMENT.success.regenerateQr)).toBeVisible();
  });

  test("garde la méthode manuelle dans l'URL", async ({ page }) => {
    await page.getByRole("tab", { name: ENROLLMENT.methods.manual.tab }).click();
    await expect(page).toHaveURL(/method=manual/);
    await expect(page.getByText(ENROLLMENT.methods.manual.subtitle)).toBeVisible();
    // Le Wi-Fi n'a de sens que dans le QR code.
    await expect(page.getByLabel(new RegExp(ENROLLMENT.config.wifi.label))).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("tab", { name: ENROLLMENT.methods.manual.tab })).toHaveAttribute("aria-selected", "true");
  });

  test("enrôle un appareil branché en USB", async ({ page }) => {
    await page.goto(`${PAGE_URL}?method=manual`);
    await expect(page.getByText(ENROLLMENT.usb.idle.title)).toBeVisible();

    await page.getByRole("button", { name: ENROLLMENT.button.connect }).click();
    await expect(page.getByText("Google Pixel 8")).toBeVisible();
    await expect(page.getByText(ENROLLMENT.usb.stepStatus.todo)).toHaveCount(3);

    const enroll = page.getByRole("button", { name: ENROLLMENT.button.enroll, exact: true });
    await enroll.click();
    await expect(page.getByText(ENROLLMENT.usb.enrolled.title, { exact: true })).toBeVisible();
    await expect(page.getByText(ENROLLMENT.usb.stepStatus.done)).toHaveCount(3);
    await expect(enroll).toBeDisabled();

    await page.getByRole("button", { name: ENROLLMENT.button.disconnect }).click();
    await expect(page.getByText(ENROLLMENT.usb.idle.title)).toBeVisible();
  });

  test("affiche le code sans USB et en génère un nouveau", async ({ page }) => {
    await page.goto(`${PAGE_URL}?method=manual`);
    await expect(page.getByText("482 913")).toBeVisible();

    await page.getByRole("button", { name: ENROLLMENT.button.regenerateCode }).click();
    await expect(page.getByText(ENROLLMENT.success.regenerateCode)).toBeVisible();
  });

  test("confirme le mode sans restriction avant de l'appliquer", async ({ page }) => {
    await page.goto(`${PAGE_URL}?method=manual`);
    await page.getByRole("button", { name: ENROLLMENT.button.applyDeviceOwner }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(ENROLLMENT.deviceOwnerDialog.title)).toBeVisible();
    await dialog.getByRole("button", { name: ENROLLMENT.button.confirmDeviceOwner, exact: true }).click();
    await expect(page.getByText(ENROLLMENT.success.applyDeviceOwner)).toBeVisible();
    await expect(dialog).toHaveCount(0);
  });
});
