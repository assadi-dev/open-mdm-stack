"use client";

import type { ReactNode } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/cards/Card";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTablePagination } from "@/components/data-table/DataTablePagination";
import { DataTableSearch } from "@/components/data-table/DataTableSearch";
import { DEVICE } from "@/constants/device";
import { useDataTable, type DataTableServerOptions } from "@/hooks/useDataTable";
import { toResultsLabel } from "../_services/devices.utils";
import type { Device } from "../_types/device.types";
import { deviceColumns } from "./device-columns";
import { RefreshDevicesAction } from "./selection-actions/RefreshDevicesAction";
import { RemoveDevicesAction } from "./selection-actions/RemoveDevicesAction";

type DevicesTableCardProps = {
  // La page courante seulement : l'API trie, filtre et pagine.
  devices: Device[];
  server: DataTableServerOptions;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  filters: ReactNode;
};

export const DevicesTableCard = ({ devices, server, isPending, isError, onRetry, filters }: DevicesTableCardProps) => {
  const dataTable = useDataTable({
    data: devices,
    columns: deviceColumns,
    enableSelection: true,
    getRowId: (device) => device.id,
    server,
  });

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <DataTableSearch
            dataTable={dataTable}
            placeholder={DEVICE.filters.search.placeholder}
            label={DEVICE.filters.search.label}
            className="h-9 w-full sm:w-70"
          />
          <Button variant="secondary" size="sm">
            <ListFilter />
            {DEVICE.button.filter}
          </Button>
          {filters}
        </div>
        {!isPending && !isError && (
          <span className="text-[0.8125rem] leading-4.5 text-muted-foreground tabular-nums">
            {toResultsLabel(dataTable.pagination.totalRows)}
          </span>
        )}
      </div>
      <CardQueryState isPending={isPending} isError={isError} onRetry={onRetry} skeletonClassName="mb-6 h-96">
        <DataTable
          dataTable={dataTable}
          showSearch={false}
          showPagination={false}
          selectionActions={() => [<RefreshDevicesAction key="refresh" />, <RemoveDevicesAction key="remove" />]}
        />
        <DataTablePagination dataTable={dataTable} itemsLabel={DEVICE.pagination.items} className="border-t border-border" />
      </CardQueryState>
    </Card>
  );
};
