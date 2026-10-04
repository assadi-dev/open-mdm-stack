import type { EnrollmentOptions, UsbEnrollment } from "../_types/enrollment.types";

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
  defaults: { name: "Terrain-Lyon", groupId: "lyon", policyId: "std" },
};

export const USB_ENROLLMENT_MOCK: UsbEnrollment = { deviceId: "d-3a1b7k2p" };

// Latence simulée : les états « en cours » (connexion, enrôlement, régénération) restent visibles le temps d'un vrai appel.
export const simulateLatency = (duration = 600) => new Promise((resolve) => setTimeout(resolve, duration));
