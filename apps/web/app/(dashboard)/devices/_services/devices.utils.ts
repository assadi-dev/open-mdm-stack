import { DEVICE } from "@/constants/device";
import { Conflict, GatewayTimeout } from "@/lib/api/intefaces/http-errors";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type {
  Device,
  DeviceFormValues,
  DeviceRefreshResult,
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
});

// Les valeurs du formulaire sont déjà rognées par le schéma : un nom vide l'efface (`null`).
export const toUpdateInput = (id: string, values: DeviceFormValues): UpdateDeviceInput => ({
  id,
  name: values.name || null,
});

// Le toast d'échec d'une actualisation : hors ligne (409) et sans réponse (504) se règlent différemment, le reste reste générique.
export const toRefreshErrorMessage = (error: unknown) => {
  if (error instanceof Conflict) return DEVICE.error.refreshOffline;
  if (error instanceof GatewayTimeout) return DEVICE.error.refreshTimeout;
  return DEVICE.error.refresh;
};

// Remplace `{count}`, `{done}`… d'un texte des constantes par des nombres.
const fillCounts = (template: string, counts: Record<string, number>) =>
  Object.entries(counts).reduce((text, [name, value]) => text.replace(`{${name}}`, formatNumber(value)), template);

// « Actualisation de 3 appareils… » : le toast de l'actualisation groupée, tant que l'API attend les appareils.
export const toRefreshManyLoading = (count: number) => fillCounts(DEVICE.toast.refreshMany.loading, { count });

// Le même toast, une fois les appareils passés : tous actualisés, une partie, ou aucun.
export const toRefreshManySuccess = (results: DeviceRefreshResult[]) => {
  const total = results.length;
  const done = results.filter(({ outcome }) => outcome === "refreshed").length;
  const { all, partial, none } = DEVICE.toast.refreshMany;

  if (done === total) return fillCounts(all, { count: total });
  if (done === 0) return fillCounts(none, { total });
  return fillCounts(partial, { done, total });
};

// « Supprimer l'appareil « Pixel 8 » ? »
export const toDeleteTitle = (name: string) => `${DEVICE.dialog.delete.title} « ${name} » ?`;

// « Supprimer 3 appareils ? »
export const toDeleteManyTitle = (count: number) => {
  const { title, items } = DEVICE.dialog.deleteMany;
  return `${title} ${formatNumber(count)} ${items} ?`;
};
