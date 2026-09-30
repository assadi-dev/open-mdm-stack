import type { CreateWifiNetworkInput, UpdateWifiNetworkInput, WifiNetwork } from "../_types/wifi-network.types";

// Les quatre réseaux de la maquette, dans le même ordre : 412 + 236 + 318 + 74 = 1 040 appareils connectés.
// Les dates sont à midi UTC : le jour affiché ne bouge dans aucun fuseau.
const buildInitialNetworks = (): WifiNetwork[] => [
  { id: "wn-entrepot-nord", ssid: "Entrepôt-Nord-5G", security: "WPA2", band: "5", hidden: true, connectedDevices: 412, createdAt: "2026-02-03T12:00:00.000Z" },
  { id: "wn-terrain-lyon", ssid: "Terrain-Lyon", security: "WPA2", band: "2.4", hidden: false, connectedDevices: 236, createdAt: "2025-11-18T12:00:00.000Z" },
  { id: "wn-siege-corp", ssid: "Siège-Corp", security: "WPA3", band: "5", hidden: false, connectedDevices: 318, createdAt: "2026-06-07T12:00:00.000Z" },
  { id: "wn-kiosque-entrepot", ssid: "Kiosque-Entrepôt", security: "WEP", band: "2.4", hidden: false, connectedDevices: 74, createdAt: "2023-09-22T12:00:00.000Z" },
];

// Le « serveur » : un état gardé le temps de la session, pour que l'ajout, la modification et la suppression se voient dans le tableau.
let networks: WifiNetwork[] | null = null;

const getNetworks = () => (networks ??= buildInitialNetworks());

const findNetworkIndex = (id: string) => {
  const index = getNetworks().findIndex((network) => network.id === id);
  if (index === -1) throw new Error(`Réseau Wi-Fi introuvable : ${id}`);
  return index;
};

export const listWifiNetworksMock = (): WifiNetwork[] => [...getNetworks()];

// Comme l'API, le mot de passe n'est jamais gardé ni relu. L'API ne connaît pas non plus la bande ni le réseau caché : ils restent vides.
export const createWifiNetworkMock = ({ ssid, security }: CreateWifiNetworkInput): WifiNetwork => {
  const network: WifiNetwork = {
    id: `wn-${crypto.randomUUID()}`,
    ssid,
    security,
    band: null,
    hidden: false,
    connectedDevices: 0,
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
