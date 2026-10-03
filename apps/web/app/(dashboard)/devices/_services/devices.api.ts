import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { DeviceDto } from "../_dto/device.dto";
import type { UpdateDeviceInput } from "../_types/device.types";

// Tous les appels passent par le proxy Next (`app/api/v1/(devices)`) vers l'API. La collection se lit au pluriel ;
// les écritures sont au singulier (`/device`), sauf la suppression, au pluriel, qui reçoit la liste des ids dans le corps.
const COLLECTION_URL = "/api/v1/devices";
const SUMMARY_URL = "/api/v1/devices/summary";
const ITEM_URL = "/api/v1/device";
const JSON_HEADERS = { "Content-Type": "application/json" };

// `query` : une page, un tri, une recherche et des filtres (`page=2&limit=8&sort=-createdAt&status=offline`).
// Sans `query`, l'API applique ses valeurs par défaut : page 1, 20 lignes, les plus récents d'abord.
export const fetchDeviceCollectionApi = async (query = "") => {
  const response = await fetch(query ? `${COLLECTION_URL}?${query}` : COLLECTION_URL);
  if (!response.ok) throw createHttpError(response.status);
  return DeviceDto.parseCollection(await response.json());
};

// Les compteurs des onglets, le sous-titre et la liste des versions d'Android décrivent tout le parc, pas la page affichée.
export const fetchDeviceSummaryApi = async () => {
  const response = await fetch(SUMMARY_URL);
  if (!response.ok) throw createHttpError(response.status);
  return DeviceDto.parseSummary(await response.json());
};

// L'id est dans l'URL, le reste dans le corps. L'API répond avec la ligne de la liste mise à jour.
export const updateDeviceApi = async ({ id, ...input }: UpdateDeviceInput) => {
  const response = await fetch(`${ITEM_URL}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw createHttpError(response.status);
  return DeviceDto.parse(await response.json());
};

// Un seul appel pour un appareil comme pour plusieurs : supprimer un seul appareil envoie une liste d'un id. L'API
// répond 204 sans corps et ignore les ids qui n'existent plus ou qui sont déjà désenrôlés.
export const removeDevicesApi = async (ids: string[]) => {
  const response = await fetch(COLLECTION_URL, {
    method: "DELETE",
    headers: JSON_HEADERS,
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw createHttpError(response.status);
};
