"use client";

import { DEVICE } from "@/constants/device";
import type { Device } from "../_types/device.types";
import { useDeviceFilters } from "../_hooks/useDeviceFilters";
import { useFetchDeviceCollection } from "../_hooks/useFetchDeviceCollection";
import { DevicesActionsBar } from "./DevicesActionsBar";
import { DevicesFilterSelect } from "./DevicesFilterSelect";
import { DevicesHeader } from "./DevicesHeader";
import { DevicesTableCard } from "./DevicesTableCard";

// Référence stable : `data ?? []` créerait un nouveau tableau à chaque rendu tant que la requête charge.
const NO_DEVICES: Device[] = [];

export const DevicesPageClient = () => {
  const { data, isPending, isError, refetch } = useFetchDeviceCollection();
  const filters = useDeviceFilters(data ?? NO_DEVICES);
  const counts = data ? filters.counts : undefined;

  return (
    <>
      <DevicesHeader counts={counts} />
      <DevicesActionsBar tab={filters.tab} onTabChange={filters.setTab} counts={counts} />
      <DevicesTableCard
        devices={filters.filteredDevices}
        isPending={isPending}
        isError={isError}
        onRetry={() => refetch()}
        filters={
          <>
            <DevicesFilterSelect
              label={DEVICE.filters.group.label}
              value={filters.group}
              options={filters.groupOptions}
              onValueChange={filters.setGroup}
            />
            <DevicesFilterSelect
              label={DEVICE.filters.android.label}
              value={filters.androidVersion}
              options={filters.androidOptions}
              onValueChange={filters.setAndroidVersion}
            />
          </>
        }
      />
    </>
  );
};
