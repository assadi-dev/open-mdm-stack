"use client";

import { useFetchWifiNetworkCollection } from "../_hooks/useFetchWifiNetworkCollection";
import type { WifiNetwork } from "../_types/wifi-network.types";
import { WifiNetworksActionsBar } from "./WifiNetworksActionsBar";
import { WifiNetworksHeader } from "./WifiNetworksHeader";
import { WifiNetworksNotice } from "./WifiNetworksNotice";
import { WifiNetworksTableCard } from "./WifiNetworksTableCard";

// Référence stable : `data ?? []` créerait un nouveau tableau à chaque rendu tant que la requête charge.
const NO_NETWORKS: WifiNetwork[] = [];

export const WifiNetworksPageClient = () => {
  const { data, isPending, isError, refetch } = useFetchWifiNetworkCollection();

  return (
    <>
      <WifiNetworksHeader networks={data} />
      <WifiNetworksActionsBar />
      <WifiNetworksNotice />
      <WifiNetworksTableCard
        networks={data ?? NO_NETWORKS}
        isPending={isPending}
        isError={isError}
        onRetry={() => refetch()}
      />
    </>
  );
};
