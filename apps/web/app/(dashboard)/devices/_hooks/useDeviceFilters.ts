import { useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { DataTableSearchParams } from "@/hooks/useDataTableSearchParams";
import { NO_DEVICE_FILTERS, TAB_STATUSES, toActiveTab } from "../_services/devices.utils";
import type { DeviceFilterValues, DeviceStatus, DeviceTab } from "../_types/device.types";

// Les noms des filtres de l'API et des parsers nuqs (`useDevicesTable`).
const STATUS_FILTER = "status";
const BRAND_FILTER = "brand";
const MODEL_FILTER = "model";
const SDK_VERSION_FILTER = "sdkVersion";
const BLOCKED_FILTER = "blocked";

const NO_STATUSES: DeviceStatus[] = [];
const NO_TEXTS: string[] = [];
const NO_VERSIONS: number[] = [];

const getFilter = <TValue>(filters: ColumnFiltersState, id: string, fallback: TValue[]) =>
  (filters.find((filter) => filter.id === id)?.value as TValue[] | undefined) ?? fallback;

// Une liste vide retire le filtre : l'URL ne garde pas de paramètre vide.
const withFilter = (filters: ColumnFiltersState, id: string, values: unknown[]): ColumnFiltersState => [
  ...filters.filter((filter) => filter.id !== id),
  ...(values.length > 0 ? [{ id, value: values }] : []),
];

// Un filtre oui/non : décoché, il quitte l'URL plutôt que d'y écrire `false`.
const withFlag = (filters: ColumnFiltersState, id: string, enabled: boolean): ColumnFiltersState => [
  ...filters.filter((filter) => filter.id !== id),
  ...(enabled ? [{ id, value: true }] : []),
];

// Les onglets et le panneau « Filtrer » vivent hors du tableau : ils lisent et écrivent les mêmes filtres d'URL que lui
// (`status`, `brand`, `model`, `sdkVersion`, `blocked`). Changer l'un d'eux ramène à la première page, comme tout filtre du tableau.
// Ces filtres ne sont pas des colonnes du tableau (la marque et la version n'en ont pas), d'où `dataTable.filters`
// laissé de côté : il compterait aussi l'onglet, et sa réinitialisation le viderait.
export const useDeviceFilters = ({ state, onColumnFiltersChange }: DataTableSearchParams["table"]) => {
  const { columnFilters } = state;
  const statuses = getFilter(columnFilters, STATUS_FILTER, NO_STATUSES);

  // Ce que le panneau a appliqué, tel que ses champs le lisent. Stable tant que l'URL ne change pas.
  const applied = useMemo<DeviceFilterValues>(
    () => ({
      brand: getFilter(columnFilters, BRAND_FILTER, NO_TEXTS),
      model: getFilter(columnFilters, MODEL_FILTER, NO_TEXTS),
      sdkVersion: getFilter(columnFilters, SDK_VERSION_FILTER, NO_VERSIONS).map(String),
      blocked: columnFilters.some((filter) => filter.id === BLOCKED_FILTER && filter.value === true),
    }),
    [columnFilters],
  );

  const setTab = (tab: DeviceTab) =>
    onColumnFiltersChange((filters) => withFilter(filters, STATUS_FILTER, TAB_STATUSES[tab]));

  // Les filtres du panneau s'appliquent d'un coup : une seule écriture de l'URL, un seul retour à la première page.
  // L'onglet (`status`) n'en fait pas partie.
  const apply = (values: DeviceFilterValues) =>
    onColumnFiltersChange((filters) =>
      withFlag(
        withFilter(
          withFilter(withFilter(filters, BRAND_FILTER, values.brand), MODEL_FILTER, values.model),
          SDK_VERSION_FILTER,
          values.sdkVersion.map(Number),
        ),
        BLOCKED_FILTER,
        values.blocked,
      ),
    );

  return {
    tab: toActiveTab(statuses),
    setTab,
    applied,
    // Le badge du bouton : une unité par valeur appliquée (Google + samsung = 2, « bloqués » = 1), l'onglet n'est pas compté.
    activeCount: applied.brand.length + applied.model.length + applied.sdkVersion.length + Number(applied.blocked),
    apply,
    reset: () => apply(NO_DEVICE_FILTERS),
  };
};
