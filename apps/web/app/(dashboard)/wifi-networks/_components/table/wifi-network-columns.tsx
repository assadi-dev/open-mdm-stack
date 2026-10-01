import { Wifi } from "lucide-react";
import { Badge } from "@/components/badges/Badge";
import { createDataTableColumnHelper } from "@/components/data-table/data-table-features";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { formatDate } from "@/lib/format";
import { toSecurityVariant } from "../../_services/wifi-networks.utils";
import type { WifiNetwork } from "../../_types/wifi-network.types";
import { WifiNetworkRowActions } from "./WifiNetworkRowActions";
import { WifiPasswordMask } from "./WifiPasswordMask";

const helper = createDataTableColumnHelper<WifiNetwork>();

const SECONDARY_LINE = "text-xs leading-4.5 text-muted-foreground";

// L'API trie, cherche et filtre : chaque id de colonne triable est un champ qu'elle sait trier (name, security, createdAt).
// Le mot de passe n'a pas de valeur (masque), il n'est ni trié ni cherché.
export const wifiNetworkColumns = [
  // Le nom du réseau, et son SSID dessous. Sans nom, le SSID prend la première ligne.
  helper.accessor((network) => network.name ?? network.ssid, {
    id: "name",
    header: WIFI_NETWORK.table.network,
    cell: ({ row }) => {
      const { name, ssid } = row.original;

      return (
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card-strong text-muted-foreground"
          >
            <Wifi className="size-4" />
          </span>
          <div className="flex flex-col text-nowrap">
            <span className="font-medium">{name ?? ssid}</span>
            {name && <span className={SECONDARY_LINE}>{ssid}</span>}
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
