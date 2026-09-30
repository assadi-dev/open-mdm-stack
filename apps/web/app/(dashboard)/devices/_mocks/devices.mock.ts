import type { Device } from "../_types/device.types";

type DeviceStatus = Device["status"];

const TOTAL_DEVICES = 1248;
const SEED = 2026;

// Effectifs de la maquette : 1 248 appareils, dont 142 hors ligne (donc 1 106 en ligne), 37 non conformes et 12 en attente.
const STATUS_QUOTAS: Record<Exclude<DeviceStatus, "compliant">, number> = {
  offline: 142,
  nonCompliant: 37,
  pending: 12,
  commandRunning: 14,
};

const MODELS = ["Pixel 8", "Pixel 8a", "Pixel 7a", "Galaxy A54", "Galaxy XCover 7", "Galaxy Tab A9", "Moto G54", "Zebra TC58"];
const SERIAL_PREFIXES = ["R58M", "3A1B", "2C9D", "ZY22", "R52W", "4H1K", "R9TW"];
const FIRST_NAMES = ["Bianca", "Dimitri", "Inès", "Paul", "Léa", "Hugo", "Nadia", "Karim", "Camille", "Yanis", "Sofia", "Louis"];
const LAST_NAMES = ["Seals", "Tech", "Moreau", "Girard", "Fontaine", "Petit", "Benali", "Roux", "Lambert", "Faure", "Chevalier", "Morel"];
const GROUPS = [
  { name: "Terrain Lyon", policy: "Terrain — standard" },
  { name: "Entrepôt Nord", policy: "Kiosque — entrepôt" },
  { name: "Livraison", policy: "Terrain — standard" },
  { name: "Siège", policy: "Bureau — BYOD" },
];
// Répartition pondérée : chaque version apparaît autant de fois que son poids.
const ANDROID_VERSIONS = [14, 14, 14, 14, 13, 13, 13, 12, 12, 11];

const MINUTE = 60_000;
const DAY_IN_MINUTES = 24 * 60;

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * MINUTE).toISOString();

// Générateur pseudo-aléatoire déterministe (mulberry32) : le même parc à chaque appel.
const createRandomTools = (seed: number) => {
  let state = seed;

  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)] as T;
  const shuffle = <T>(items: T[]) => {
    for (let index = items.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [items[index], items[other]] = [items[other] as T, items[index] as T];
    }
    return items;
  };

  return { between, pick, shuffle };
};

// Les huit premières lignes reprennent celles de la maquette, dans le même ordre.
const buildFeaturedDevices = (): Device[] => [
  { id: "d-a12f", model: "Pixel 8", serial: "3A1B-A12F", user: "Bianca Seals", group: "Terrain Lyon", policy: "Terrain — standard", androidVersion: 14, status: "compliant", battery: 72, lastSeenAt: minutesAgo(3) },
  { id: "d-7c09", model: "Galaxy A54", serial: "R58N-7C09", user: "Dimitri Tech", group: "Terrain Lyon", policy: "Terrain — standard", androidVersion: 13, status: "offline", battery: 12, lastSeenAt: minutesAgo(2 * DAY_IN_MINUTES) },
  { id: "d-b204", model: "Pixel 7a", serial: "2C9D-B204", user: "Inès Moreau", group: "Entrepôt Nord", policy: "Kiosque — entrepôt", androidVersion: 14, status: "compliant", battery: 88, lastSeenAt: minutesAgo(1) },
  { id: "d-33d1", model: "Moto G54", serial: "ZY22-33D1", user: "Paul Girard", group: "Livraison", policy: "Terrain — standard", androidVersion: 13, status: "commandRunning", battery: 54, lastSeenAt: minutesAgo(6) },
  { id: "d-9e10", model: "Galaxy XCover 7", serial: "R52W-9E10", user: "Léa Fontaine", group: "Entrepôt Nord", policy: "Kiosque — entrepôt", androidVersion: 13, status: "nonCompliant", battery: 63, lastSeenAt: minutesAgo(18) },
  { id: "d-c7f3", model: "Pixel 8a", serial: "4H1K-C7F3", user: "Hugo Petit", group: "Siège", policy: "Bureau — BYOD", androidVersion: 14, status: "compliant", battery: 91, lastSeenAt: minutesAgo(2) },
  { id: "d-0a77", model: "Zebra TC58", serial: "21-3309-0A77", user: "Kiosque partagé", group: "Entrepôt Nord", policy: "Kiosque — entrepôt", androidVersion: 11, status: "compliant", battery: 100, lastSeenAt: minutesAgo(1) },
  { id: "d-5b2e", model: "Galaxy Tab A9", serial: "R9TW-5B2E", user: "Nadia Benali", group: "Siège", policy: "Bureau — BYOD", androidVersion: 14, status: "pending", battery: null, lastSeenAt: minutesAgo(12) },
];

// Statuts restant à répartir une fois les lignes de la maquette placées.
const buildStatusPool = (featured: Device[]) => {
  const remaining = { ...STATUS_QUOTAS };
  for (const { status } of featured) {
    if (status !== "compliant") remaining[status]--;
  }

  const pool = (Object.keys(remaining) as (keyof typeof remaining)[]).flatMap((status) =>
    Array.from({ length: remaining[status] }, (): DeviceStatus => status),
  );
  const compliantCount = TOTAL_DEVICES - featured.length - pool.length;

  return [...pool, ...Array.from({ length: compliantCount }, (): DeviceStatus => "compliant")];
};

// Fonction et non constante : les dates relatives doivent partir de l'instant de l'appel.
export const buildDevicesMock = (): Device[] => {
  const { between, pick, shuffle } = createRandomTools(SEED);
  const featured = buildFeaturedDevices();

  const lastSeenMinutes = (status: DeviceStatus) => {
    if (status === "offline") return between(DAY_IN_MINUTES, 10 * DAY_IN_MINUTES);
    if (status === "pending") return between(5, 60);
    return between(1, 120);
  };

  const buildGeneratedDevice = (status: DeviceStatus, index: number): Device => {
    // 7 919 est premier avec 36⁴ : chaque indice donne un suffixe de série distinct.
    const suffix = (((index + 1) * 7919) % 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
    const group = pick(GROUPS);

    return {
      id: `d-${suffix.toLowerCase()}`,
      model: pick(MODELS),
      serial: `${pick(SERIAL_PREFIXES)}-${suffix}`,
      user: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      group: group.name,
      policy: group.policy,
      androidVersion: pick(ANDROID_VERSIONS),
      status,
      battery: status === "pending" ? null : between(5, 100),
      lastSeenAt: minutesAgo(lastSeenMinutes(status)),
    };
  };

  return [...featured, ...shuffle(buildStatusPool(featured)).map(buildGeneratedDevice)];
};
