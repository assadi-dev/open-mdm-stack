import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { WifiNetworkDto } from "../_dto/wifi-network.dto";
import { removeWifiNetworkMock, updateWifiNetworkMock } from "../_mocks/wifi-networks.mock";
import type { CreateWifiNetworkInput, UpdateWifiNetworkInput } from "../_types/wifi-network.types";

// La collection se lit au pluriel ; les écritures sont au singulier (`/wifi-network`), sauf la suppression groupée,
// au pluriel, qui reçoit la liste des ids dans le corps.
const COLLECTION_URL = "/api/v1/wifi-networks";
const ITEM_URL = "/api/v1/wifi-network";
// Le sous-titre compte tous les réseaux enregistrés, sans la recherche ni les filtres du tableau : une ligne suffit pour lire le total.
const REGISTERED_COUNT_QUERY = "limit=1";

// La liste et l'ajout passent par le proxy Next (`app/api/v1/(wifi-networks)`) vers l'API ; la liste avec la query du tableau
// (`page=1&limit=8&sort=-createdAt`). La modification et la suppression restent sur `_mocks/` : le proxy n'expose pas encore PATCH ni DELETE.
// Passer à l'API réelle : remplacer chaque mock par un `fetch` (PATCH et DELETE /wifi-network/:id, suppression groupée sur /wifi-networks).

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

// L'API valide le corps et répond 201 avec le réseau créé, sans son mot de passe (écrit seulement).
export const createWifiNetworkApi = async (input: CreateWifiNetworkInput) => {
  const response = await fetch(ITEM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw createHttpError(response.status);
  return WifiNetworkDto.parse(await response.json());
};

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
