"use client";

import { useDevicesTable } from "../_hooks/useDevicesTable";
import { useFetchDeviceSummary } from "../_hooks/useFetchDeviceSummary";
import { toTabCounts } from "../_services/devices.utils";
import { DevicesActionsBar } from "./DevicesActionsBar";
import { DevicesHeader } from "./DevicesHeader";
import { DevicesFilter } from "./table/DevicesFilter";
import { DevicesTableCard } from "./DevicesTableCard";

export const DevicesPageClient = () => {
  const { devices, server, filters, isPending, isError, refetch } = useDevicesTable();
  // Les compteurs, les versions d'Android, les marques et les modèles décrivent tout le parc : une requête à part, que le
  // tableau ne fait pas bouger.
  const { data: summary } = useFetchDeviceSummary();
  const counts = summary ? toTabCounts(summary) : undefined;

  return (
    <>
      <DevicesHeader counts={counts} />
      <DevicesActionsBar tab={filters.tab} onTabChange={filters.setTab} counts={counts} />
      <DevicesTableCard
        devices={devices}
        server={server}
        isPending={isPending}
        isError={isError}
        onRetry={() => refetch()}
        filters={
          <DevicesFilter
            summary={summary}
            applied={filters.applied}
            activeCount={filters.activeCount}
            onApply={filters.apply}
            onReset={filters.reset}
          />
        }
      />
    </>
  );
};
