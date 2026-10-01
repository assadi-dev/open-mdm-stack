import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchWifiNetworkCollectionApi } from "../_services/wifi-networks.api";
import { WIFI_NETWORKS } from "../_services/wifi-networks.queries";

// `query` : une page, un tri, une recherche et des filtres (`page=2&limit=8&sort=name`).
// Sans `query`, les valeurs par défaut de l'API : page 1, 20 lignes, les plus récentes d'abord.
export const useFetchWifiNetworkCollection = (query = "") =>
  useQuery({
    queryKey: WIFI_NETWORKS.collectionPage(query),
    queryFn: () => fetchWifiNetworkCollectionApi(query),
    // Pendant le chargement d'une autre page, le tableau garde les lignes affichées au lieu de repasser en squelette.
    placeholderData: keepPreviousData,
  });
