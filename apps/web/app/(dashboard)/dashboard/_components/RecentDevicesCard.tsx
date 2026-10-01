"use client";

import { ListFilter } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { SectionCard } from "@/components/cards/SectionCard";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableSearch } from "@/components/data-table/DataTableSearch";
import { DASHBOARD } from "@/constants/dashboard";
import { useDataTable } from "@/hooks/useDataTable";
import { useFetchRecentDevices } from "../_hooks/useFetchRecentDevices";
import type { RecentDevice } from "../_types/dashboard.types";
import { recentDevicesColumns } from "./recent-devices-columns";

// Référence stable : `data ?? []` créerait un nouveau tableau à chaque rendu tant que la requête charge.
const NO_DEVICES: RecentDevice[] = [];
const PAGE_SIZE = 6;

export const RecentDevicesCard = () => {
  const { data, isPending, isError, refetch } = useFetchRecentDevices();
  const dataTable = useDataTable({
    data: data ?? NO_DEVICES,
    columns: recentDevicesColumns,
    pageSize: PAGE_SIZE,
    getRowId: (device) => device.id,
  });

  return (
    <SectionCard
      titleSize="lg"
      title={DASHBOARD.recent.title}
      description={DASHBOARD.recent.description}
      className="overflow-hidden pb-0"
      action={
        <>
          <DataTableSearch dataTable={dataTable} className="h-9 w-40 sm:w-65" />
          <Button variant="secondary" size="sm">
            <ListFilter />
            {DASHBOARD.button.filter}
          </Button>
        </>
      }
    >
      <CardQueryState isPending={isPending} isError={isError} onRetry={() => refetch()} skeletonClassName="mb-6 h-64">
        <DataTable dataTable={dataTable} showSearch={false} showPagination={false} />
      </CardQueryState>
    </SectionCard>
  );
};
