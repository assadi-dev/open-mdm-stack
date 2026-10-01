import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { WifiNetworkDto } from "../_dto/wifi-network.dto";
import { removeWifiNetworkMock } from "../_mocks/wifi-networks.mock";
import type { CreateWifiNetworkInput, UpdateWifiNetworkInput } from "../_types/wifi-network.types";

// La collection se lit au pluriel ; les écritures sont au singulier (`/wifi-network`), sauf la suppression groupée,
// au pluriel, qui reçoit la liste des ids dans le corps.
const COLLECTION_URL = "/api/v1/wifi-networks";
const ITEM_URL = "/api/v1/wifi-network";
// Le sous-titre compte tous les réseaux enregistrés, sans la recherche ni les filtres du tableau : une ligne suffit pour lire le total.
const REGISTERED_COUNT_QUERY = "limit=1";

// La liste, l'ajout et la modification passent par le proxy Next (`app/api/v1/(wifi-networks)`) vers l'API ; la liste avec la query
// du tableau (`page=1&limit=8&sort=-createdAt`). La suppression n'est pas encore branchée et reste sur `_mocks/`.
// Passer à l'API réelle : un seul appel pour un réseau comme pour plusieurs, `DELETE /api/v1/wifi-networks` avec `{ ids }`
// (la suppression d'un seul réseau envoie `[id]`). Le proxy et l'API sont prêts.
const JSON_HEADERS = { "Content-Type": "application/json" };

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
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw createHttpError(response.status);
  return WifiNetworkDto.parse(await response.json());
};

// L'id est dans l'URL, le reste dans le corps. Un mot de passe absent conserve l'actuel, `name: null` efface le nom.
export const updateWifiNetworkApi = async ({ id, ...input }: UpdateWifiNetworkInput) => {
  const response = await fetch(`${ITEM_URL}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw createHttpError(response.status);
  return WifiNetworkDto.parse(await response.json());
};

export const removeWifiNetworkApi = async (id: string) => {
  removeWifiNetworkMock(id);
};

// Action vide pour l'instant : rien n'est supprimé. La brancher = `DELETE /api/v1/wifi-networks` avec `{ ids }`.
export const removeWifiNetworksApi = async (ids: string[]) => {
  void ids;
};
