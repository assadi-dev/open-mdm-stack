import type { BreadcrumbEntry } from "../../_types/page-header.types";
import { ENROLLMENT } from "@/constants/enrollment";
import { ENROLLMENT_METHOD_KEYS } from "../_dto/enrollment.dto";
import type {
  EnrollmentConfigFormValues,
  EnrollmentMethod,
  EnrollmentOption,
  EnrollmentOptions,
  ProvisioningInput,
  UsbDevice,
  UsbEnrollmentInput,
  UsbEnrollmentStatus,
  UsbStep,
  UsbStepStatus,
} from "../_types/enrollment.types";

const PAGE_HREF = "/enrollment";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// La valeur du choix « Aucun » du réseau Wi-Fi : une liste déroulante ne porte que des textes.
export const NO_WIFI = "none";

export const USB_STEPS = Object.keys(ENROLLMENT.usb.steps) as UsbStep[];

export const isEnrollmentMethod = (value: unknown): value is EnrollmentMethod =>
  ENROLLMENT_METHOD_KEYS.includes(value as EnrollmentMethod);

// « Enrôlement › Nouveau QR code » : le second niveau garde l'onglet dans son lien.
export const toBreadcrumbs = (method: EnrollmentMethod): BreadcrumbEntry[] => [
  { label: ENROLLMENT.page.breadcrumb, href: PAGE_HREF },
  { label: ENROLLMENT.methods[method].breadcrumb, href: `${PAGE_HREF}?method=${method}` },
];

// Remplace `{version}` d'un texte des constantes.
const fillVersion = (template: string, version: string) => template.replace("{version}", version);

export const toApkUrlDescription = (version: string) => fillVersion(ENROLLMENT.config.apkUrl.description, version);
export const toInstallStepDescription = (version: string) => fillVersion(ENROLLMENT.usb.steps.install.description, version);

export const toGroupOptions = ({ groups }: EnrollmentOptions): EnrollmentOption[] =>
  groups.map(({ id, name }) => ({ value: id, label: name }));

// « Terrain — standard (v7) »
export const toPolicyOptions = ({ policies }: EnrollmentOptions): EnrollmentOption[] =>
  policies.map(({ id, name, version }) => ({ value: id, label: `${name} (v${version})` }));

// « Entrepôt-Nord-5G · WPA2 », après le choix « Aucun ».
export const toWifiOptions = ({ wifiNetworks }: EnrollmentOptions): EnrollmentOption[] => [
  { value: NO_WIFI, label: ENROLLMENT.config.wifi.none },
  ...wifiNetworks.map(({ id, ssid, security }) => ({ value: id, label: `${ssid} · ${security}` })),
];

// Le formulaire part des réglages par défaut du serveur : sans réseau Wi-Fi, avec l'APK par défaut.
export const toConfigFormValues = ({ defaults }: EnrollmentOptions): EnrollmentConfigFormValues => ({
  ...defaults,
  wifiId: NO_WIFI,
  apkUrl: "",
});

// Les valeurs du formulaire sont déjà rognées par le schéma : « Aucun » et une URL vide laissent le serveur décider.
export const toProvisioningInput = ({ name, groupId, policyId, wifiId, apkUrl }: EnrollmentConfigFormValues): ProvisioningInput => ({
  name,
  groupId,
  policyId,
  ...(wifiId !== NO_WIFI && { wifiId }),
  ...(apkUrl && { apkUrl }),
});

// L'appareil branché est déjà sur un réseau : le Wi-Fi choisi pour le QR code ne le suit pas.
export const toUsbEnrollmentInput = (values: EnrollmentConfigFormValues, { serial }: UsbDevice): UsbEnrollmentInput => ({
  ...toProvisioningInput({ ...values, wifiId: NO_WIFI }),
  serial,
});

// L'URL saisie, sinon l'APK par défaut du serveur : le bouton de téléchargement sert toujours un fichier.
export const toAgentApkUrl = (apkUrl: string, { agent }: EnrollmentOptions) => apkUrl.trim() || agent.apkUrl;

// « 482 913 » : deux groupes de trois chiffres, plus faciles à recopier.
export const formatEnrollmentCode = (token: string) => `${token.slice(0, 3)} ${token.slice(3)}`;

export const isExpired = (expiresAt: string, now: number) => new Date(expiresAt).getTime() <= now;

// « Expire dans 23 h 52 », « Expire dans 8 min » : le temps restant, arrondi à la minute inférieure.
export const toRemainingLabel = (expiresAt: string, now: number) => {
  const remaining = new Date(expiresAt).getTime() - now;
  const hours = Math.floor(remaining / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const duration = hours > 0 ? `${hours} h ${String(minutes).padStart(2, "0")}` : `${Math.max(minutes, 1)} min`;
  return `${ENROLLMENT.expiry.in} ${duration}`;
};

// « Google Pixel 8 »
export const toUsbDeviceName = ({ brand, model }: UsbDevice) => (brand ? `${brand} ${model}` : model);

// « N° 3A1B7K2P · Android 14 · ADB autorisé »
export const toUsbDeviceMeta = ({ serial, androidVersion, adbAuthorized }: UsbDevice) => {
  const { device } = ENROLLMENT.usb;
  return [`${device.serial} ${serial}`, `${device.android} ${androidVersion}`, ...(adbAuthorized ? [device.adbAuthorized] : [])].join(
    " · ",
  );
};

// L'enrôlement par USB fait les trois étapes d'un seul appel : elles avancent ensemble.
export const toUsbStepStatus = (status: UsbEnrollmentStatus): UsbStepStatus => {
  if (status === "enrolled") return "done";
  if (status === "enrolling") return "running";
  return "todo";
};

// Le SVG renvoyé par l'API, affiché dans une balise `<img>` : aucun balisage injecté dans la page.
export const toSvgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const downloadSvg = (svg: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

// Imprime l'image seule, dans un cadre invisible : la page du dashboard n'est pas imprimée avec.
export const printImage = (src: string, title: string) =>
  new Promise<void>((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.onload = () => {
      const view = frame.contentWindow;
      if (!view) {
        frame.remove();
        reject(new Error("Print frame unavailable"));
        return;
      }
      view.addEventListener("afterprint", () => frame.remove(), { once: true });
      view.focus();
      view.print();
      resolve();
    };
    frame.srcdoc = `<!doctype html><title>${title}</title><body style="margin:0;display:grid;place-items:center;height:100vh"><img src="${src}" alt="${title}" style="width:8cm;height:8cm"></body>`;
    document.body.append(frame);
  });
