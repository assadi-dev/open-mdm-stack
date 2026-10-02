import { createHttpError } from "@/lib/api/intefaces/http-errors";
import { DeviceDto } from "../_dto/device.dto";

// Tous les appels passent par le proxy Next (`app/api/v1/(devices)`) vers l'API.
const COLLECTION_URL = "/api/v1/devices";
const SUMMARY_URL = "/api/v1/devices/summary";

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
