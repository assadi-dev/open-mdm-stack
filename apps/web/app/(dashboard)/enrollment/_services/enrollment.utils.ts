import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
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
  UsbStep,
  UsbStepStatus,
  UsbStepStatuses,
} from "../_types/enrollment.types";

const PAGE_HREF = "/enrollment";

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

// Le proxy Next qui sert l'APK de l'agent (`app/api/v1/(enrollment)/enrollment/agent`) : le navigateur ne télécharge jamais
// l'APK directement.
export const AGENT_DOWNLOAD_URL = "/api/v1/enrollment/agent";

// L'URL saisie est transmise au proxy ; sans elle, il sert l'APK par défaut du serveur, qu'il est seul à connaître.
export const toAgentDownloadUrl = (apkUrl = "") => {
  const url = apkUrl.trim();
  return url ? `${AGENT_DOWNLOAD_URL}?${new URLSearchParams({ apkUrl: url })}` : AGENT_DOWNLOAD_URL;
};

// L'appareil d'une session ADB, tel que son descripteur USB le décrit. Une session n'existe qu'une fois l'appareil
// autorisé ; sa version d'Android n'est pas encore lue.
export const toUsbDevice = ({ raw, serial }: AdbDaemonWebUsbDevice): UsbDevice => ({
  brand: raw.manufacturerName ?? null,
  model: raw.productName ?? ENROLLMENT.usb.device.unknownModel,
  serial,
  androidVersion: null,
  adbAuthorized: true,
});

// « Google Pixel 8 »
export const toUsbDeviceName = ({ brand, model }: UsbDevice) => (brand ? `${brand} ${model}` : model);

// « N° 3A1B7K2P · Android 14 · ADB autorisé », sans ce que l'appareil n'a pas encore dit.
export const toUsbDeviceMeta = ({ serial, androidVersion, adbAuthorized }: UsbDevice) => {
  const { device } = ENROLLMENT.usb;
  return [
    `${device.serial} ${serial}`,
    ...(androidVersion ? [`${device.android} ${androidVersion}`] : []),
    ...(adbAuthorized ? [device.adbAuthorized] : []),
  ].join(" · ");
};

// Les étapes avancent l'une après l'autre : celles déjà faites, celle en cours quand l'enrôlement tourne, les autres à faire.
export const toUsbStepStatuses = (doneSteps: readonly UsbStep[], isRunning: boolean): UsbStepStatuses => {
  const current = toCurrentUsbStep(doneSteps);
  const toStatus = (step: UsbStep): UsbStepStatus => {
    if (doneSteps.includes(step)) return "done";
    return isRunning && step === current ? "running" : "todo";
  };
  return Object.fromEntries(USB_STEPS.map((step) => [step, toStatus(step)])) as UsbStepStatuses;
};

export const wait = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));

// L'étape qui a le focus : celle en cours, ou la prochaine à faire. Aucune une fois toutes faites.
export const toCurrentUsbStep = (doneSteps: readonly UsbStep[]) => USB_STEPS.find((step) => !doneSteps.includes(step)) ?? null;

// L'étape de l'enrôlement par USB qui a échoué, pour dire laquelle dans le message ; l'erreur d'origine est dans `cause`.
export class UsbStepError extends Error {
  readonly step: UsbStep;

  constructor(step: UsbStep, cause: unknown) {
    super(`USB enrollment failed at step "${step}"`, { cause });
    this.step = step;
  }
}

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
