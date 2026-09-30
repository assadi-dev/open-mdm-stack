import { WifiNetworkDto } from "../_dto/wifi-network.dto";
import {
  createWifiNetworkMock,
  listWifiNetworksMock,
  removeWifiNetworkMock,
  updateWifiNetworkMock,
} from "../_mocks/wifi-networks.mock";
import type { CreateWifiNetworkInput, UpdateWifiNetworkInput } from "../_types/wifi-network.types";

// Les données viennent de `_mocks/` : la liste de l'API (`GET /wifi-networks/lists`) ne renvoie que id, ssid et sécurité,
// sans date de création, bande, réseau caché ni nombre d'appareils connectés, que la page affiche.
// Passer à l'API réelle : remplacer chaque mock par un `fetch` (POST /wifi-networks, PATCH et DELETE /wifi-networks/:id),
// le parsing Zod reste identique.

export const fetchWifiNetworkCollectionApi = async () => WifiNetworkDto.parseCollection(listWifiNetworksMock());

export const createWifiNetworkApi = async (input: CreateWifiNetworkInput) =>
  WifiNetworkDto.parse(createWifiNetworkMock(input));

export const updateWifiNetworkApi = async (input: UpdateWifiNetworkInput) =>
  WifiNetworkDto.parse(updateWifiNetworkMock(input));

export const removeWifiNetworkApi = async (id: string) => {
  removeWifiNetworkMock(id);
};
