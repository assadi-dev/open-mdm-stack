"use client";

import type { SortingState } from "@tanstack/react-table";
import { parseAsArrayOf, parseAsStringLiteral } from "nuqs";
import { useDataTableSearchParams } from "@/hooks/useDataTableSearchParams";
import { WIFI_SECURITY_KEYS } from "../_dto/wifi-network.dto";
import { useFetchWifiNetworkCollection } from "../_hooks/useFetchWifiNetworkCollection";
import { useFetchWifiNetworkCount } from "../_hooks/useFetchWifiNetworkCount";
import type { WifiNetwork } from "../_types/wifi-network.types";
import { WifiNetworksActionsBar } from "./WifiNetworksActionsBar";
import { WifiNetworksHeader } from "./WifiNetworksHeader";
import { WifiNetworksNotice } from "./WifiNetworksNotice";
import { WifiNetworksTableCard } from "./WifiNetworksTableCard";

const PAGE_SIZE = 8;
// Le même ordre que l'API sans paramètre `sort` : l'en-tête « Créé le » l'affiche dès l'arrivée.
const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];
const FILTERS = { security: parseAsArrayOf(parseAsStringLiteral(WIFI_SECURITY_KEYS)) };

// Référence stable : `data ?? []` créerait un nouveau tableau à chaque rendu tant que la requête charge.
const NO_NETWORKS: WifiNetwork[] = [];

export const WifiNetworksPageClient = () => {
  const searchParams = useDataTableSearchParams({
    pageSize: PAGE_SIZE,
    defaultSorting: DEFAULT_SORTING,
    filters: FILTERS,
  });
  const { data, isPending, isError, refetch } = useFetchWifiNetworkCollection(searchParams.query);
  const { data: registeredCount } = useFetchWifiNetworkCount();

  return (
    <>
      <WifiNetworksHeader registeredCount={registeredCount} />
      <WifiNetworksActionsBar />
      <WifiNetworksNotice />
      <WifiNetworksTableCard
        networks={data?.data ?? NO_NETWORKS}
        server={{ ...searchParams.table, rowCount: data?.metadata.total ?? 0 }}
        isPending={isPending}
        isError={isError}
        onRetry={() => refetch()}
      />
    </>
  );
};
