import type {
  AndroidVersions,
  CommandsFlow,
  Compliance,
  RecentDevice,
} from "../_types/dashboard.types";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const COMMANDS_FLOW_MOCK: CommandsFlow = {
  months: [
    { month: "2026-04", count: 620 },
    { month: "2026-05", count: 540 },
    { month: "2026-06", count: 690 },
    { month: "2026-07", count: 910 },
    { month: "2026-08", count: 780 },
    { month: "2026-09", count: 1272 },
  ],
  highlightMonth: "2026-07",
};

export const COMPLIANCE_MOCK: Compliance = { compliantCount: 1074, totalCount: 1248 };

export const ANDROID_VERSIONS_MOCK: AndroidVersions = {
  totalCount: 1248,
  versions: [
    { label: "Android 14", count: 524 },
    { label: "Android 13", count: 325 },
    { label: "Android 12", count: 225 },
    { label: "Android ≤ 11", count: 112 },
    { label: "Autres", count: 62, other: true },
  ],
};

// Fonction et non constante : les dates relatives doivent partir de l'instant de l'appel.
export const buildRecentDevicesMock = (): RecentDevice[] => [
  { id: "d-a12f", model: "Pixel 8", serial: "R58M-A12F", user: "Bianca Seals", group: "Terrain Lyon", status: "compliant", battery: 72, lastSeenAt: minutesAgo(3) },
  { id: "d-7c09", model: "Galaxy A54", serial: "R58N-7C09", user: "Dimitri Tech", group: "Terrain Lyon", status: "offline", battery: 12, lastSeenAt: minutesAgo(2 * 24 * 60) },
  { id: "d-b204", model: "Pixel 7a", serial: "3A1B-B204", user: "Inès Moreau", group: "Entrepôt Nord", status: "compliant", battery: 88, lastSeenAt: minutesAgo(1) },
  { id: "d-33d1", model: "Moto G54", serial: "ZY22-33D1", user: "Paul Girard", group: "Livraison", status: "commandRunning", battery: 54, lastSeenAt: minutesAgo(6) },
  { id: "d-9e10", model: "Galaxy XCover 7", serial: "R58X-9E10", user: "Léa Fontaine", group: "Entrepôt Nord", status: "nonCompliant", battery: 63, lastSeenAt: minutesAgo(18) },
  { id: "d-c7f3", model: "Pixel 8a", serial: "3A1B-C7F3", user: "Hugo Petit", group: "Siège", status: "compliant", battery: 91, lastSeenAt: minutesAgo(2) },
];
