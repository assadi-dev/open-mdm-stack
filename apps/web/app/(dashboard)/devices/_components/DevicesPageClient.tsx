"use client";

import { DEVICE } from "@/constants/device";
import { useDevicesTable } from "../_hooks/useDevicesTable";
import { useFetchDeviceSummary } from "../_hooks/useFetchDeviceSummary";
import { toAndroidOptions, toTabCounts } from "../_services/devices.utils";
import { DevicesActionsBar } from "./DevicesActionsBar";
import { DevicesFilterSelect } from "./DevicesFilterSelect";
import { DevicesHeader } from "./DevicesHeader";
import { DevicesTableCard } from "./DevicesTableCard";

export const DevicesPageClient = () => {
  const { devices, server, filters, isPending, isError, refetch } = useDevicesTable();
  // Les compteurs et les versions d'Android décrivent tout le parc : une requête à part, que le tableau ne fait pas bouger.
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
          summary && (
            <DevicesFilterSelect
              label={DEVICE.filters.android.label}
              value={filters.sdkVersion}
              options={toAndroidOptions(summary)}
              onValueChange={filters.setSdkVersion}
            />
          )
        }
      />
    </>
  );
};
