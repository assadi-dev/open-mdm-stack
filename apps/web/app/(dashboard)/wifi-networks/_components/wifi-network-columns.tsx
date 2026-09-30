import { Wifi } from "lucide-react";
import { Badge } from "@/components/badges/Badge";
import { createDataTableColumnHelper } from "@/components/data-table/data-table-features";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { formatDate } from "@/lib/format";
import { toNetworkDetails, toSecurityVariant } from "../_services/wifi-networks.utils";
import type { WifiNetwork } from "../_types/wifi-network.types";
import { WifiNetworkRowActions } from "./WifiNetworkRowActions";
import { WifiPasswordMask } from "./WifiPasswordMask";

const helper = createDataTableColumnHelper<WifiNetwork>();

const SECONDARY_LINE = "text-xs leading-4.5 text-muted-foreground";

// La recherche et le tri portent sur la valeur d'accesseur : le réseau expose son nom et sa ligne de détail, la sécurité son libellé,
// la date son timestamp. Le mot de passe n'a pas de valeur (masque), il n'est ni trié ni cherché.
export const wifiNetworkColumns = [
  helper.accessor((network) => `${network.ssid} ${toNetworkDetails(network)}`, {
    id: "network",
    header: WIFI_NETWORK.table.network,
    cell: ({ row }) => {
      const details = toNetworkDetails(row.original);

      return (
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card-strong text-muted-foreground"
          >
            <Wifi className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.ssid}</span>
            {details && <span className={SECONDARY_LINE}>{details}</span>}
          </div>
        </div>
      );
    },
  }),
  helper.accessor((network) => WIFI_NETWORK.security[network.security], {
    id: "security",
    header: WIFI_NETWORK.table.security,
    cell: ({ row }) => (
      <Badge variant={toSecurityVariant(row.original.security)}>{WIFI_NETWORK.security[row.original.security]}</Badge>
    ),
  }),
  helper.display({
    id: "password",
    header: WIFI_NETWORK.table.password,
    cell: () => <WifiPasswordMask />,
  }),
  helper.accessor((network) => new Date(network.createdAt).getTime(), {
    id: "createdAt",
    header: WIFI_NETWORK.table.createdAt,
    enableGlobalFilter: false,
    cell: (info) => <span className="text-muted-foreground tabular-nums">{formatDate(info.getValue())}</span>,
  }),
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">{WIFI_NETWORK.table.actions}</span>,
    cell: ({ row }) => <WifiNetworkRowActions network={row.original} />,
  }),
];
