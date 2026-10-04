import { expect, test } from "@playwright/test";
import { ENROLLMENT } from "@/constants/enrollment";
import { USB_DEVICE, stubWebUsb } from "../support/webusb";

// Le QR code, le code à saisir et les réseaux Wi-Fi viennent de l'API ; la sélection de l'appareil USB vient de WebUSB
// (remplacé par `support/webusb`), et l'enrôlement par USB d'un mock de la page (`enrollment/_mocks`).
const PAGE_URL = "/enrollment";

test.describe("enrôlement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.getByRole("heading", { level: 1, name: ENROLLMENT.page.title })).toBeVisible();
  });

  test("ouvre la méthode QR code par défaut, sans QR code, avec les réglages du serveur", async ({ page }) => {
    await expect(page.getByRole("tab", { name: ENROLLMENT.methods.qr.tab })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(ENROLLMENT.methods.qr.subtitle)).toBeVisible();
    await expect(page.getByText(ENROLLMENT.qr.empty.title)).toBeVisible();
    await expect(page.getByRole("img", { name: ENROLLMENT.qr.alt })).toHaveCount(0);
    // Le pied du formulaire ne propose de régénérer qu'un QR code déjà affiché.
    await expect(page.getByRole("button", { name: ENROLLMENT.button.regenerateQr })).toHaveCount(0);
    await expect(page.getByLabel(ENROLLMENT.config.name.label)).toHaveValue("Terrain-Lyon");
    await expect(page.getByLabel(ENROLLMENT.config.group.label)).toContainText("Terrain Lyon");
    await expect(page.getByLabel(new RegExp(ENROLLMENT.config.wifi.label))).toContainText(ENROLLMENT.config.wifi.none);
  });

  test("génère le QR code à la demande, puis le régénère", async ({ page }) => {
    await page.getByRole("button", { name: ENROLLMENT.button.generateQr }).click();
    await expect(page.getByRole("img", { name: ENROLLMENT.qr.alt })).toBeVisible();
    await expect(page.getByText(ENROLLMENT.success.generateQr)).toBeVisible();
    await expect(page.getByText(ENROLLMENT.qr.empty.title)).toHaveCount(0);

    await page.getByRole("button", { name: ENROLLMENT.button.regenerateQr }).click();
    await expect(page.getByText(ENROLLMENT.success.generateQr)).toHaveCount(2);
  });

  test("refuse une URL d'agent invalide, puis génère le QR code après réinitialisation", async ({ page }) => {
    const apkUrl = page.getByLabel(new RegExp(ENROLLMENT.config.apkUrl.label));
    const generate = page.getByRole("button", { name: ENROLLMENT.button.generateQr });

    await apkUrl.fill("pas-une-url");
    await generate.click();
    await expect(page.getByText(ENROLLMENT.validation.apkUrlInvalid)).toBeVisible();
    await expect(page.getByText(ENROLLMENT.qr.empty.title)).toBeVisible();

    await page.getByRole("button", { name: ENROLLMENT.button.reset }).click();
    await expect(apkUrl).toHaveValue("");
    await generate.click();
    await expect(page.getByRole("img", { name: ENROLLMENT.qr.alt })).toBeVisible();
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
    await stubWebUsb(page, "device");
    await page.goto(`${PAGE_URL}?method=manual`);
    await expect(page.getByText(ENROLLMENT.usb.idle.title)).toBeVisible();

    await page.getByRole("button", { name: ENROLLMENT.button.connect }).click();
    await expect(page.getByText(`${USB_DEVICE.manufacturer} ${USB_DEVICE.product}`)).toBeVisible();
    // Le descripteur USB ne dit ni la version d'Android ni l'autorisation ADB : la ligne n'affiche que le numéro de série.
    await expect(page.getByText(`${ENROLLMENT.usb.device.serial} ${USB_DEVICE.serial}`, { exact: true })).toBeVisible();
    await expect(page.getByText(ENROLLMENT.success.connect)).toBeVisible();
    await expect(page.getByText(ENROLLMENT.usb.stepStatus.todo)).toHaveCount(3);

    const enroll = page.getByRole("button", { name: ENROLLMENT.button.enroll, exact: true });
    await enroll.click();
    await expect(page.getByText(ENROLLMENT.usb.enrolled.title, { exact: true })).toBeVisible();
    await expect(page.getByText(ENROLLMENT.usb.stepStatus.done)).toHaveCount(3);
    await expect(enroll).toBeDisabled();

    await page.getByRole("button", { name: ENROLLMENT.button.disconnect }).click();
    await expect(page.getByText(ENROLLMENT.usb.idle.title)).toBeVisible();
  });

  test("reste sur la connexion quand la sélection de l'appareil est refermée sans choix", async ({ page }) => {
    await stubWebUsb(page, "cancel");
    await page.goto(`${PAGE_URL}?method=manual`);

    const connect = page.getByRole("button", { name: ENROLLMENT.button.connect });
    await connect.click();
    await expect(connect).toBeEnabled();
    await expect(page.getByText(ENROLLMENT.usb.idle.title)).toBeVisible();
    await expect(page.getByText(ENROLLMENT.success.connect)).toHaveCount(0);
    await expect(page.getByText(ENROLLMENT.error.connect)).toHaveCount(0);
  });

  test("recommande l'installation avec un code quand le navigateur n'a pas WebUSB", async ({ page }) => {
    await stubWebUsb(page, "unsupported");
    await page.goto(`${PAGE_URL}?method=manual`);

    await page.getByRole("button", { name: ENROLLMENT.button.connect }).click();
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast.getByText(ENROLLMENT.usb.unsupported.message)).toBeVisible();
    await expect(toast.getByText(ENROLLMENT.usb.unsupported.recommendation)).toBeVisible();
    await expect(page.getByText(ENROLLMENT.usb.idle.title)).toBeVisible();

    // L'action du toast mène à la carte du code, comme le bouton de l'encart sous la carte USB.
    await toast.getByRole("button", { name: ENROLLMENT.button.installWithCode }).click();
    await expect(page.getByText(ENROLLMENT.noUsb.code.empty.title)).toBeVisible();
  });

  test("génère le code à saisir dans l'agent à la demande, puis un nouveau", async ({ page }) => {
    await page.goto(`${PAGE_URL}?method=manual`);
    await page.getByRole("button", { name: ENROLLMENT.button.installWithCode }).click();
    await expect(page.getByText(ENROLLMENT.noUsb.code.empty.title)).toBeVisible();

    await page.getByRole("button", { name: ENROLLMENT.button.generateCode, exact: true }).click();
    await expect(page.getByText(ENROLLMENT.success.generateCode)).toBeVisible();
    // Les 6 chiffres d'un seul tenant, sans espace.
    await expect(page.getByText(/^\d{6}$/)).toBeVisible();

    await page.getByRole("button", { name: ENROLLMENT.button.regenerateCode }).click();
    await expect(page.getByText(ENROLLMENT.success.generateCode).first()).toBeVisible();
  });

  test("confirme le mode sans restriction avant de l'appliquer", async ({ page }) => {
    await page.goto(`${PAGE_URL}?method=manual`);
    await page.getByRole("button", { name: ENROLLMENT.button.installWithCode }).click();
    await page.getByRole("button", { name: ENROLLMENT.button.applyDeviceOwner }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(ENROLLMENT.deviceOwnerDialog.title)).toBeVisible();
    await dialog.getByRole("button", { name: ENROLLMENT.button.confirmDeviceOwner, exact: true }).click();
    await expect(page.getByText(ENROLLMENT.success.applyDeviceOwner)).toBeVisible();
    await expect(dialog).toHaveCount(0);
  });
});
