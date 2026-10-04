import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchDeviceCollectionApi } from "../_services/devices.api";
import { DEVICES } from "../_services/devices.queries";

// `query` : une page, un tri, une recherche et des filtres (`page=2&limit=8&sort=-createdAt`).
// Sans `query`, les valeurs par défaut de l'API : page 1, 20 lignes, les plus récents d'abord.
export const useFetchDeviceCollection = (query = "") =>
  useQuery({
    queryKey: DEVICES.collectionPage(query),
    queryFn: () => fetchDeviceCollectionApi(query),
    // Pendant le chargement d'une autre page, le tableau garde les lignes affichées au lieu de repasser en squelette.
    placeholderData: keepPreviousData,
  });
