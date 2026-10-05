"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/cards/Card";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnVisibility } from "@/components/data-table/DataTableColumnVisibility";
import { DataTablePagination } from "@/components/data-table/DataTablePagination";
import { DataTableSearch } from "@/components/data-table/DataTableSearch";
import { DEVICE } from "@/constants/device";
import { useDataTable, type DataTableServerOptions } from "@/hooks/useDataTable";
import { isDeviceBlocked } from "../_services/devices.utils";
import type { Device } from "../_types/device.types";
import { deviceColumns } from "./device-columns";
import { BlockDevicesAction } from "./selection-actions/BlockDevicesAction";
import { RefreshDevicesAction } from "./selection-actions/RefreshDevicesAction";
import { RemoveDevicesAction } from "./selection-actions/RemoveDevicesAction";
import { UnblockDevicesAction } from "./selection-actions/UnblockDevicesAction";

type DevicesTableCardProps = {
  // La page courante seulement : l'API trie, filtre et pagine.
  devices: Device[];
  server: DataTableServerOptions;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  // Le bouton « Filtrer », à droite de la barre du tableau.
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
        </div>
        {/* Le total des appareils est dans l'en-tête de la page : ici, les boutons « Filtrer » et « Colonnes ». */}
        <div className="flex items-center gap-2">
          {filters}
          <DataTableColumnVisibility dataTable={dataTable} />
        </div>
      </div>
      <CardQueryState isPending={isPending} isError={isError} onRetry={onRetry} skeletonClassName="mb-6 h-96">
        <DataTable
          dataTable={dataTable}
          showSearch={false}
          showPagination={false}
          // « Bloquer » ne reçoit que les appareils non bloqués de la sélection, « Débloquer » que les bloqués : chacune
          // n'apparaît que si elle a de quoi agir, les deux pour une sélection mixte.
          selectionActions={(selected) => {
            const blocked = selected.filter(isDeviceBlocked);
            const unblocked = selected.filter((device) => !isDeviceBlocked(device));

            return [
              <RefreshDevicesAction key="refresh" devices={selected} />,
              ...(unblocked.length > 0
                ? [<BlockDevicesAction key="block" devices={unblocked} onBlocked={dataTable.selection.clear} />]
                : []),
              ...(blocked.length > 0 ? [<UnblockDevicesAction key="unblock" devices={blocked} />] : []),
              <RemoveDevicesAction key="remove" devices={selected} onDeleted={dataTable.selection.clear} />,
            ];
          }}
        />
        <DataTablePagination dataTable={dataTable} itemsLabel={DEVICE.pagination.items} className="border-t border-border" />
      </CardQueryState>
    </Card>
  );
};
