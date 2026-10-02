import { functionalUpdate, type OnChangeFn, type SortingState } from "@tanstack/react-table";
import { parseAsArrayOf, parseAsInteger, parseAsStringLiteral } from "nuqs";
import { useDataTableSearchParams } from "@/hooks/useDataTableSearchParams";
import { DEVICE_STATUS_KEYS } from "../_dto/device.dto";
import type { Device } from "../_types/device.types";
import { useDeviceFilters } from "./useDeviceFilters";
import { useFetchDeviceCollection } from "./useFetchDeviceCollection";

const PAGE_SIZE = 8;
// Le même ordre que l'API sans paramètre `sort` : les appareils les plus récemment enrôlés d'abord.
const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];
const FILTERS = {
  status: parseAsArrayOf(parseAsStringLiteral(DEVICE_STATUS_KEYS)),
  sdkVersion: parseAsArrayOf(parseAsInteger),
};

// Référence stable : `data ?? []` créerait un nouveau tableau à chaque rendu tant que la requête charge.
const NO_DEVICES: Device[] = [];

// La colonne « Dernier contact » (id `lastHeartbeatAt`) trie sur les deux dates de l'API : le heartbeat d'abord,
// le changement de présence pour départager. La seconde date suit toujours la première, dans le même sens.
const CONTACT_SORT = "lastHeartbeatAt";
const CONTACT_PRESENCE_SORT = "presenceChangedAt";

const withContactSort = (sorting: SortingState): SortingState => {
  const contact = sorting.find(({ id }) => id === CONTACT_SORT);
  const others = sorting.filter(({ id }) => id !== CONTACT_SORT && id !== CONTACT_PRESENCE_SORT);

  return contact ? [contact, { id: CONTACT_PRESENCE_SORT, desc: contact.desc }, ...others] : others;
};

// Le tableau des appareils : son état vit dans l'URL et donne la requête de la page affichée.
export const useDevicesTable = () => {
  const searchParams = useDataTableSearchParams({
    pageSize: PAGE_SIZE,
    defaultSorting: DEFAULT_SORTING,
    filters: FILTERS,
  });
  const { data, isPending, isError, refetch } = useFetchDeviceCollection(searchParams.query);
  const filters = useDeviceFilters(searchParams.table);

  const onSortingChange: OnChangeFn<SortingState> = (updater) =>
    searchParams.table.onSortingChange((current) => withContactSort(functionalUpdate(updater, current)));

  return {
    devices: data?.data ?? NO_DEVICES,
    // À passer tel quel à `useDataTable({ server })`.
    server: { ...searchParams.table, onSortingChange, rowCount: data?.metadata.total ?? 0 },
    // Les onglets et la version d'Android, qui vivent hors du tableau.
    filters,
    isPending,
    isError,
    refetch,
  };
};
