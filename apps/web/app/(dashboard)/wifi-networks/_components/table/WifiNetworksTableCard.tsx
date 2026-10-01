"use client";

import { Card } from "@/components/cards/Card";
import { CardQueryState } from "@/components/cards/CardQueryState";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnVisibility } from "@/components/data-table/DataTableColumnVisibility";
import { DataTablePagination } from "@/components/data-table/DataTablePagination";
import { DataTableSearch } from "@/components/data-table/DataTableSearch";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { useDataTable, type DataTableServerOptions } from "@/hooks/useDataTable";
import { toResultsLabel } from "../../_services/wifi-networks.utils";
import type { WifiNetwork } from "../../_types/wifi-network.types";
import { RemoveWifiNetworksAction } from "../selection-actions/RemoveWifiNetworksAction";
import { wifiNetworkColumns } from "./wifi-network-columns";
import { WifiNetworksFilter } from "./WifiNetworksFilter";

type WifiNetworksTableCardProps = {
  // La page courante seulement : l'API trie, filtre et pagine.
  networks: WifiNetwork[];
  server: DataTableServerOptions;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

export const WifiNetworksTableCard = ({ networks, server, isPending, isError, onRetry }: WifiNetworksTableCardProps) => {
  const dataTable = useDataTable({
    data: networks,
    columns: wifiNetworkColumns,
    enableSelection: true,
    getRowId: (network) => network.id,
    server,
  });

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <DataTableSearch
            dataTable={dataTable}
            placeholder={WIFI_NETWORK.filters.search.placeholder}
            label={WIFI_NETWORK.filters.search.label}
            className="h-9 w-full sm:w-70"
          />

        </div>
        <div className="flex items-center gap-2">
          <WifiNetworksFilter dataTable={dataTable} />
          <DataTableColumnVisibility dataTable={dataTable} />
        </div>
      </div>
      <CardQueryState isPending={isPending} isError={isError} onRetry={onRetry} skeletonClassName="mb-6 h-56">
        <DataTable
          dataTable={dataTable}
          showSearch={false}
          showPagination={false}
          selectionActions={(selected) => [
            <RemoveWifiNetworksAction key="remove" networks={selected} onDeleted={dataTable.selection.clear} />,
          ]}
        />
        <DataTablePagination
          dataTable={dataTable}
          itemsLabel={WIFI_NETWORK.pagination.items}
          className="border-t border-border"
        />
      </CardQueryState>
    </Card>
  );
};
