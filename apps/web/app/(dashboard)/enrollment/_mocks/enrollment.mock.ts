import type { EnrollmentCode, EnrollmentOptions, EnrollmentQr, UsbDevice, UsbEnrollment } from "../_types/enrollment.types";

// La durée de vie d'un QR code et d'un code de l'API (`ENROLLMENT_CHALLENGE_TTL_SECONDS`, `ENROLLMENT_OTP_TTL_SECONDS`).
const TTL_SECONDS = 24 * 3600;
const AGENT_APK_URL = "https://mdm.entreprise.fr/agent/openmdm-agent.apk";

const fromNow = (duration: number) => new Date(Date.now() + duration).toISOString();

export const ENROLLMENT_OPTIONS_MOCK: EnrollmentOptions = {
  groups: [
    { id: "lyon", name: "Terrain Lyon" },
    { id: "nord", name: "Entrepôt Nord" },
    { id: "liv", name: "Livraison" },
    { id: "siege", name: "Siège" },
  ],
  policies: [
    { id: "std", name: "Terrain — standard", version: 7 },
    { id: "kio", name: "Kiosque — entrepôt", version: 3 },
  ],
  wifiNetworks: [
    { id: "nord", ssid: "Entrepôt-Nord-5G", security: "WPA2" },
    { id: "lyon", ssid: "Terrain-Lyon", security: "WPA2" },
    { id: "siege", ssid: "Siège-Corp", security: "WPA3" },
  ],
  agent: { version: "0.4.2", apkUrl: AGENT_APK_URL },
  defaults: { namePattern: "Terrain-Lyon-{n}", groupId: "lyon", policyId: "std" },
};

// Ce que `POST /enrollment/display-provisioning?format=svg` renvoie : un document SVG produit par la lib `qrcode` (marge 2).
const QR_SVG_MOCK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" shape-rendering="crispEdges"><path fill="#ffffff" d="M0 0h33v33H0z"/><path stroke="#000000" d="M2 2.5h7m3 0h1m1 0h3m3 0h1m1 0h1m1 0h7M2 3.5h1m5 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h2m2 0h1m1 0h1m5 0h1M2 4.5h1m1 0h3m1 0h1m1 0h1m7 0h1m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1M2 5.5h1m1 0h3m1 0h1m1 0h3m2 0h1m1 0h3m2 0h1m1 0h1m1 0h3m1 0h1M2 6.5h1m1 0h3m1 0h1m2 0h3m6 0h3m1 0h1m1 0h3m1 0h1M2 7.5h1m5 0h1m2 0h2m3 0h1m2 0h1m2 0h1m1 0h1m5 0h1M2 8.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M10 9.5h2m1 0h1m2 0h2m2 0h2M2 10.5h1m5 0h1m1 0h1m2 0h7m2 0h3m2 0h3M2 11.5h1m1 0h3m3 0h1m1 0h1m2 0h3m3 0h1m3 0h2m1 0h2M6 12.5h1m1 0h1m1 0h2m1 0h2m1 0h5m1 0h1M2 13.5h3m4 0h1m1 0h1m4 0h1m3 0h1m2 0h1m1 0h1m1 0h1M6 14.5h3m1 0h1m6 0h1m2 0h1m1 0h1m1 0h2m4 0h1M2 15.5h2m2 0h2m2 0h1m1 0h1m1 0h2m1 0h6m1 0h1m1 0h1m2 0h2M4 16.5h1m3 0h2m1 0h2m1 0h6m4 0h5M6 17.5h2m1 0h1m1 0h1m2 0h1m2 0h1m3 0h2m2 0h1m2 0h1m1 0h1M3 18.5h1m1 0h1m1 0h2m3 0h1m6 0h1m2 0h1m4 0h2M2 19.5h3m2 0h1m3 0h1m3 0h1m1 0h1m2 0h7m1 0h3M2 20.5h3m2 0h4m2 0h2m2 0h3m1 0h2m1 0h4m2 0h1M2 21.5h1m1 0h2m3 0h1m3 0h1m1 0h1m2 0h1m6 0h2M2 22.5h1m3 0h4m2 0h3m1 0h1m2 0h1m2 0h5m1 0h3M10 23.5h1m2 0h1m2 0h2m1 0h4m3 0h2M2 24.5h7m3 0h1m1 0h1m2 0h1m1 0h1m1 0h2m1 0h1m1 0h3M2 25.5h1m5 0h1m2 0h4m1 0h1m1 0h1m1 0h3m3 0h1M2 26.5h1m1 0h3m1 0h1m3 0h1m1 0h3m1 0h1m2 0h7m1 0h1M2 27.5h1m1 0h3m1 0h1m2 0h4m1 0h3m2 0h1m1 0h1m3 0h2m1 0h1M2 28.5h1m1 0h3m1 0h1m2 0h4m2 0h5m2 0h6M2 29.5h1m5 0h1m2 0h3m3 0h1m2 0h1m3 0h5m1 0h1M2 30.5h7m1 0h2m2 0h2m3 0h1m1 0h1m1 0h3m2 0h1"/></svg>';

// Fonctions et non constantes : l'expiration part de l'instant de l'appel, comme un QR code ou un code tout juste générés.
export const buildEnrollmentQrMock = (): EnrollmentQr => ({
  svg: QR_SVG_MOCK,
  link: `https://mdm.entreprise.fr/enroll/qr/${Date.now().toString(36)}`,
  expiresAt: fromNow(TTL_SECONDS * 1000),
});

// Le premier code est celui de la maquette ; un nouveau code est tiré au hasard, comme le ferait le serveur.
export const INITIAL_ENROLLMENT_CODE_MOCK = "482913";
export const randomEnrollmentCodeMock = () => String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

export const buildEnrollmentCodeMock = (token: string): EnrollmentCode => ({
  token,
  expiresAt: fromNow(TTL_SECONDS * 1000),
  ttl: TTL_SECONDS,
});

export const USB_DEVICE_MOCK: UsbDevice = {
  brand: "Google",
  model: "Pixel 8",
  serial: "3A1B7K2P",
  androidVersion: "14",
  adbAuthorized: true,
};

export const USB_ENROLLMENT_MOCK: UsbEnrollment = { deviceId: "d-3a1b7k2p" };

// Latence simulée : les états « en cours » (connexion, enrôlement, régénération) restent visibles le temps d'un vrai appel.
export const simulateLatency = (duration = 600) => new Promise((resolve) => setTimeout(resolve, duration));
