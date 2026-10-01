import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchWifiNetworkCollectionApi } from "../_services/wifi-networks.api";
import { WIFI_NETWORKS } from "../_services/wifi-networks.queries";

// `query` vient de `useDataTableSearchParams` : une page, un tri, une recherche et des filtres donnés.
export const useFetchWifiNetworkCollection = (query: string) =>
  useQuery({
    queryKey: WIFI_NETWORKS.collectionPage(query),
    queryFn: () => fetchWifiNetworkCollectionApi(query),
    // Pendant le chargement d'une autre page, le tableau garde les lignes affichées au lieu de repasser en squelette.
    placeholderData: keepPreviousData,
  });
