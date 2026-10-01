import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { WifiNetworkDto } from "../_dto/wifi-network.dto";
import { createWifiNetworkMock, removeWifiNetworkMock, updateWifiNetworkMock } from "../_mocks/wifi-networks.mock";
import type { CreateWifiNetworkInput, UpdateWifiNetworkInput } from "../_types/wifi-network.types";

const COLLECTION_URL = "/api/v1/wifi-networks";
// Le sous-titre compte tous les réseaux enregistrés, sans la recherche ni les filtres du tableau : une ligne suffit pour lire le total.
const REGISTERED_COUNT_QUERY = "limit=1";

// La liste passe par le proxy Next (`app/api/v1/(wifi-networks)`) vers l'API, avec la query du tableau (`page=1&limit=8&sort=-createdAt`).
// L'ajout, la modification et la suppression restent sur `_mocks/` : le proxy n'expose pas encore POST, PATCH ni DELETE.
// Passer à l'API réelle : remplacer chaque mock par un `fetch` (POST /wifi-networks, PATCH et DELETE /wifi-networks/:id).

// Sans `query`, l'API applique ses valeurs par défaut : page 1, 20 lignes, les plus récentes d'abord.
export const fetchWifiNetworkCollectionApi = async (query = "") => {
  const response = await fetch(query ? `${COLLECTION_URL}?${query}` : COLLECTION_URL);
  if (!response.ok) throw createHttpError(response.status);
  return WifiNetworkDto.parseCollection(await response.json());
};

export const fetchWifiNetworkCountApi = async () => {
  const { metadata } = await fetchWifiNetworkCollectionApi(REGISTERED_COUNT_QUERY);
  return metadata.total;
};

export const createWifiNetworkApi = async (input: CreateWifiNetworkInput) =>
  WifiNetworkDto.parse(createWifiNetworkMock(input));

export const updateWifiNetworkApi = async (input: UpdateWifiNetworkInput) =>
  WifiNetworkDto.parse(updateWifiNetworkMock(input));

export const removeWifiNetworkApi = async (id: string) => {
  removeWifiNetworkMock(id);
};

// Action vide pour l'instant : rien n'est supprimé. L'API n'a pas de suppression groupée,
// la brancher = un DELETE /api/v1/wifi-networks/:id par réseau (route proxy à créer).
export const removeWifiNetworksApi = async (ids: string[]) => {
  void ids;
};
