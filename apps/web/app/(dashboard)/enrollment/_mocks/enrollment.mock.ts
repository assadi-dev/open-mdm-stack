import type { EnrollmentOptions, UsbDevice, UsbEnrollment } from "../_types/enrollment.types";

const AGENT_APK_URL = "https://mdm.entreprise.fr/agent/openmdm-agent.apk";

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
