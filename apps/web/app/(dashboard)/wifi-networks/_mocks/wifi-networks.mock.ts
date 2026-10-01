import type { CreateWifiNetworkInput, UpdateWifiNetworkInput, WifiNetwork } from "../_types/wifi-network.types";

// Les quatre réseaux de la maquette, dans le même ordre.
// Les dates sont à midi UTC : le jour affiché ne bouge dans aucun fuseau.
const buildInitialNetworks = (): WifiNetwork[] => [
  { id: "wn-entrepot-nord", name: null, ssid: "Entrepôt-Nord-5G", security: "WPA2", createdAt: "2026-02-03T12:00:00.000Z" },
  { id: "wn-terrain-lyon", name: null, ssid: "Terrain-Lyon", security: "WPA2", createdAt: "2025-11-18T12:00:00.000Z" },
  { id: "wn-siege-corp", name: null, ssid: "Siège-Corp", security: "WPA3", createdAt: "2026-06-07T12:00:00.000Z" },
  { id: "wn-kiosque-entrepot", name: null, ssid: "Kiosque-Entrepôt", security: "WEP", createdAt: "2023-09-22T12:00:00.000Z" },
];

// Le « serveur » des mutations, gardé le temps de la session. La liste, elle, vient de l'API : ce qui est écrit ici n'y apparaît pas,
// et un réseau de l'API est introuvable ici (modifier ou supprimer échoue) tant que les mutations ne passent pas par l'API.
let networks: WifiNetwork[] | null = null;

const getNetworks = () => (networks ??= buildInitialNetworks());

const findNetworkIndex = (id: string) => {
  const index = getNetworks().findIndex((network) => network.id === id);
  if (index === -1) throw new Error(`Réseau Wi-Fi introuvable : ${id}`);
  return index;
};

// Comme l'API, le mot de passe n'est jamais gardé ni relu.
export const createWifiNetworkMock = ({ ssid, security }: CreateWifiNetworkInput): WifiNetwork => {
  const network: WifiNetwork = {
    id: `wn-${crypto.randomUUID()}`,
    name: null,
    ssid,
    security,
    createdAt: new Date().toISOString(),
  };
  networks = [network, ...getNetworks()];
  return network;
};

export const updateWifiNetworkMock = ({ id, ssid, security }: UpdateWifiNetworkInput): WifiNetwork => {
  const index = findNetworkIndex(id);
  const updated: WifiNetwork = { ...(getNetworks()[index] as WifiNetwork), ssid, security };
  networks = getNetworks().map((network, position) => (position === index ? updated : network));
  return updated;
};

export const removeWifiNetworkMock = (id: string) => {
  const index = findNetworkIndex(id);
  networks = getNetworks().filter((_, position) => position !== index);
};
