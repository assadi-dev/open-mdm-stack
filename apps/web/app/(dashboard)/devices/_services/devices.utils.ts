import { DEVICE } from "@/constants/device";
import { formatNumber } from "@/lib/format";
import type { Device, DeviceFilters, DeviceTab, DeviceTabCounts, FilterOption } from "../_types/device.types";

export const ALL_FILTER = "all";

// Un appareil en attente d'enrôlement a déjà contacté le serveur : il compte parmi les appareils en ligne.
const TAB_PREDICATES: Record<DeviceTab, (device: Device) => boolean> = {
  all: () => true,
  online: (device) => device.status !== "offline",
  offline: (device) => device.status === "offline",
  nonCompliant: (device) => device.status === "nonCompliant",
  pending: (device) => device.status === "pending",
};

const DEVICE_TABS = Object.keys(DEVICE.tabs) as DeviceTab[];

export const isDeviceTab = (value: unknown): value is DeviceTab =>
  typeof value === "string" && DEVICE_TABS.includes(value as DeviceTab);

export const toTabCounts = (devices: Device[]) =>
  Object.fromEntries(DEVICE_TABS.map((tab) => [tab, devices.filter(TAB_PREDICATES[tab]).length])) as DeviceTabCounts;

export const filterDevices = (devices: Device[], { tab, group, androidVersion }: DeviceFilters) =>
  devices.filter(
    (device) =>
      TAB_PREDICATES[tab](device) &&
      (group === ALL_FILTER || device.group === group) &&
      (androidVersion === ALL_FILTER || String(device.androidVersion) === androidVersion),
  );

export const toGroupOptions = (devices: Device[]): FilterOption[] => [
  { value: ALL_FILTER, label: DEVICE.filters.group.all },
  ...[...new Set(devices.map(({ group }) => group))]
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((group) => ({ value: group, label: group })),
];

export const toAndroidOptions = (devices: Device[]): FilterOption[] => [
  { value: ALL_FILTER, label: DEVICE.filters.android.all },
  ...[...new Set(devices.map(({ androidVersion }) => androidVersion))]
    .sort((a, b) => b - a)
    .map((version) => ({ value: String(version), label: `${DEVICE.filters.android.version} ${version}` })),
];

export const toDevicesSubtitle = ({ all, online }: DeviceTabCounts) =>
  `${formatNumber(all)} ${all > 1 ? DEVICE.page.subtitle.enrolled.many : DEVICE.page.subtitle.enrolled.one} · ${formatNumber(online)} ${DEVICE.page.subtitle.online}`;

export const toResultsLabel = (count: number) =>
  `${formatNumber(count)} ${count > 1 ? DEVICE.results.many : DEVICE.results.one}`;
