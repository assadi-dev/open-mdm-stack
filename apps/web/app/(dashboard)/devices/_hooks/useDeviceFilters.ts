import type { ColumnFiltersState } from "@tanstack/react-table";
import type { DataTableSearchParams } from "@/hooks/useDataTableSearchParams";
import { ALL_FILTER, TAB_STATUSES, toActiveTab } from "../_services/devices.utils";
import type { DeviceStatus, DeviceTab } from "../_types/device.types";

// Les noms des filtres de l'API et des parsers nuqs (`useDevicesTable`).
const STATUS_FILTER = "status";
const SDK_VERSION_FILTER = "sdkVersion";

const NO_STATUSES: DeviceStatus[] = [];
const NO_VERSIONS: number[] = [];

const getFilter = <TValue>(filters: ColumnFiltersState, id: string, fallback: TValue[]) =>
  (filters.find((filter) => filter.id === id)?.value as TValue[] | undefined) ?? fallback;

// Une liste vide retire le filtre : l'URL ne garde pas de paramètre vide.
const withFilter = (filters: ColumnFiltersState, id: string, values: unknown[]): ColumnFiltersState => [
  ...filters.filter((filter) => filter.id !== id),
  ...(values.length > 0 ? [{ id, value: values }] : []),
];

// Les onglets et la liste des versions d'Android vivent hors du tableau : ils lisent et écrivent les mêmes filtres d'URL
// (`status`, `sdkVersion`) que lui. Changer l'un d'eux ramène à la première page, comme tout filtre du tableau.
export const useDeviceFilters = ({ state, onColumnFiltersChange }: DataTableSearchParams["table"]) => {
  const statuses = getFilter(state.columnFilters, STATUS_FILTER, NO_STATUSES);
  const sdkVersions = getFilter(state.columnFilters, SDK_VERSION_FILTER, NO_VERSIONS);

  const setTab = (tab: DeviceTab) =>
    onColumnFiltersChange((filters) => withFilter(filters, STATUS_FILTER, TAB_STATUSES[tab]));

  // La liste n'en propose qu'une à la fois : `sdkVersion=34`.
  const setSdkVersion = (value: string) =>
    onColumnFiltersChange((filters) =>
      withFilter(filters, SDK_VERSION_FILTER, value === ALL_FILTER ? [] : [Number(value)]),
    );

  return {
    tab: toActiveTab(statuses),
    setTab,
    sdkVersion: sdkVersions[0] === undefined ? ALL_FILTER : String(sdkVersions[0]),
    setSdkVersion,
  };
};
