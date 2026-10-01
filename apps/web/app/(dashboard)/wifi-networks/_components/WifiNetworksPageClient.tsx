"use client";

import { useFetchWifiNetworkCount } from "../_hooks/useFetchWifiNetworkCount";
import { useWifiNetworksTable } from "../_hooks/useWifiNetworksTable";
import { WifiNetworksActionsBar } from "./WifiNetworksActionsBar";
import { WifiNetworksHeader } from "./WifiNetworksHeader";
import { WifiNetworksNotice } from "./WifiNetworksNotice";
import { WifiNetworksTableCard } from "./table/WifiNetworksTableCard";

export const WifiNetworksPageClient = () => {
  const { networks, server, isPending, isError, refetch } = useWifiNetworksTable();
  const { data: registeredCount } = useFetchWifiNetworkCount();

  return (
    <>
      <WifiNetworksHeader registeredCount={registeredCount} />
      <WifiNetworksActionsBar />
      <WifiNetworksNotice />
      <WifiNetworksTableCard
        networks={networks}
        server={server}
        isPending={isPending}
        isError={isError}
        onRetry={() => refetch()}
      />
    </>
  );
};
