import type { SortingState } from "@tanstack/react-table";
import { parseAsArrayOf, parseAsStringLiteral } from "nuqs";
import { useDataTableSearchParams } from "@/hooks/useDataTableSearchParams";
import { WIFI_SECURITY_KEYS } from "../_dto/wifi-network.dto";
import type { WifiNetwork } from "../_types/wifi-network.types";
import { useFetchWifiNetworkCollection } from "./useFetchWifiNetworkCollection";

const PAGE_SIZE = 8;
// Le même ordre que l'API sans paramètre `sort` : l'en-tête « Créé le » l'affiche dès l'arrivée.
const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];
const FILTERS = { security: parseAsArrayOf(parseAsStringLiteral(WIFI_SECURITY_KEYS)) };

// Référence stable : `data ?? []` créerait un nouveau tableau à chaque rendu tant que la requête charge.
const NO_NETWORKS: WifiNetwork[] = [];

// Le tableau des réseaux : son état vit dans l'URL et donne la requête de la page affichée.
export const useWifiNetworksTable = () => {
  const searchParams = useDataTableSearchParams({
    pageSize: PAGE_SIZE,
    defaultSorting: DEFAULT_SORTING,
    filters: FILTERS,
  });
  const { data, isPending, isError, refetch } = useFetchWifiNetworkCollection(searchParams.query);

  return {
    networks: data?.data ?? NO_NETWORKS,
    // À passer tel quel à `useDataTable({ server })`.
    server: { ...searchParams.table, rowCount: data?.metadata.total ?? 0 },
    isPending,
    isError,
    refetch,
  };
};
