import { DEVICE } from "@/constants/device";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type {
  Device,
  DeviceFormValues,
  DeviceStatus,
  DeviceSummary,
  DeviceTab,
  DeviceTabCounts,
  FilterOption,
  UpdateDeviceInput,
} from "../_types/device.types";

export const ALL_FILTER = "all";

// Les statuts de l'API que chaque onglet réunit (`status=online,commandRunning,pending`) ; « Tous » ne filtre pas.
// Un appareil en attente d'enrôlement a déjà contacté le serveur : il compte parmi les appareils en ligne.
export const TAB_STATUSES: Record<DeviceTab, DeviceStatus[]> = {
  all: [],
  online: ["online", "commandRunning", "pending"],
  offline: ["offline"],
  pending: ["pending"],
};

const DEVICE_TABS = Object.keys(DEVICE.tabs) as DeviceTab[];

// Un appareil connecté en MQTT est joignable maintenant : ses dates n'ont plus rien à dire.
const CONNECTED_STATUSES: DeviceStatus[] = ["online", "commandRunning"];

export const isDeviceTab = (value: unknown): value is DeviceTab =>
  typeof value === "string" && DEVICE_TABS.includes(value as DeviceTab);

const isSameSet = (a: DeviceStatus[], b: DeviceStatus[]) => a.length === b.length && a.every((status) => b.includes(status));

// L'onglet actif se lit dans le filtre `status` de l'URL. Un filtre saisi à la main qu'aucun onglet ne réunit n'en active aucun.
export const toActiveTab = (statuses: DeviceStatus[]) => DEVICE_TABS.find((tab) => isSameSet(TAB_STATUSES[tab], statuses));

export const toTabCounts = ({ total, byStatus }: DeviceSummary) =>
  Object.fromEntries(
    DEVICE_TABS.map((tab) => [
      tab,
      tab === "all" ? total : TAB_STATUSES[tab].reduce((count, status) => count + byStatus[status], 0),
    ]),
  ) as DeviceTabCounts;

// Les versions viennent du résumé (tout le parc), déjà classées de la plus récente à la plus ancienne.
export const toAndroidOptions = ({ androidVersions }: DeviceSummary): FilterOption[] => [
  { value: ALL_FILTER, label: DEVICE.filters.android.all },
  ...androidVersions.map(({ sdkVersion, androidVersion }) => ({
    value: String(sdkVersion),
    label: `${DEVICE.filters.android.version} ${androidVersion ?? sdkVersion}`,
  })),
];

export const toDevicesSubtitle = ({ all, online }: DeviceTabCounts) =>
  `${formatNumber(all)} ${all > 1 ? DEVICE.page.subtitle.enrolled.many : DEVICE.page.subtitle.enrolled.one} · ${formatNumber(online)} ${DEVICE.page.subtitle.online}`;

export const toResultsLabel = (count: number) =>
  `${formatNumber(count)} ${count > 1 ? DEVICE.results.many : DEVICE.results.one}`;

// Le nom donné à l'appareil, sinon son modèle (l'API le résout dans `displayName`).
export const toDeviceName = ({ displayName }: Pick<Device, "displayName">) => displayName ?? DEVICE.unknownDevice;

// La date la plus récente entre le dernier heartbeat et le dernier changement de présence, `null` si l'appareil n'a jamais été vu.
export const toLastSeenTime = ({ lastHeartbeatAt, presenceChangedAt }: Pick<Device, "lastHeartbeatAt" | "presenceChangedAt">) => {
  const times = [lastHeartbeatAt, presenceChangedAt].flatMap((date) => (date ? [new Date(date).getTime()] : []));
  return times.length > 0 ? Math.max(...times) : null;
};

export const toLastContactLabel = (device: Device) => {
  if (CONNECTED_STATUSES.includes(device.status)) return DEVICE.lastContact.now;

  const lastSeen = toLastSeenTime(device);
  return lastSeen === null ? DEVICE.lastContact.never : formatRelativeTime(lastSeen);
};

// Le formulaire part de ce que l'appareil porte : un champ absent est vide.
export const toDeviceFormValues = (device: Device): DeviceFormValues => ({
  name: device.name ?? "",
  androidVersion: device.androidVersion ?? "",
  sdkVersion: device.sdkVersion === null ? "" : String(device.sdkVersion),
  androidId: device.androidId ?? "",
});

// Les valeurs du formulaire sont déjà rognées par le schéma : un champ vide efface la valeur (`null`).
export const toUpdateInput = (id: string, values: DeviceFormValues): UpdateDeviceInput => ({
  id,
  name: values.name || null,
  androidVersion: values.androidVersion || null,
  sdkVersion: values.sdkVersion === "" ? null : Number(values.sdkVersion),
  androidId: values.androidId || null,
});
