import type { EnrollmentCode, EnrollmentOptions, UsbDevice, UsbEnrollment } from "../_types/enrollment.types";

// La durée de vie d'un code de l'API (`ENROLLMENT_OTP_TTL_SECONDS`).
const TTL_SECONDS = 24 * 3600;
const AGENT_APK_URL = "https://mdm.entreprise.fr/agent/openmdm-agent.apk";

const fromNow = (duration: number) => new Date(Date.now() + duration).toISOString();

// Les réseaux Wi-Fi ne sont pas fictifs : ils viennent de `GET /wifi-networks` (`fetchEnrollmentOptionsApi`).
export const ENROLLMENT_OPTIONS_MOCK: Omit<EnrollmentOptions, "wifiNetworks"> = {
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
  agent: { version: "0.4.2", apkUrl: AGENT_APK_URL },
  defaults: { name: "Terrain-Lyon", groupId: "lyon", policyId: "std" },
};

// Le premier code est celui de la maquette ; un nouveau code est tiré au hasard, comme le ferait le serveur.
export const INITIAL_ENROLLMENT_CODE_MOCK = "482913";
export const randomEnrollmentCodeMock = () => String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

// Fonction et non constante : l'expiration part de l'instant de l'appel, comme un code tout juste généré.
export const buildEnrollmentCodeMock = (code: string): EnrollmentCode => ({
  code,
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
