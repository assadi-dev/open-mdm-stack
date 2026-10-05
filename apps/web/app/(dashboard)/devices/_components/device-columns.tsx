import { createDataTableColumnHelper } from "@/components/data-table/data-table-features";
import { BatteryMeter } from "@/components/devices/BatteryMeter";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { DEVICE } from "@/constants/device";
import { isDeviceBlocked, toDeviceName, toLastContactLabel, toLastSeenTime } from "../_services/devices.utils";
import type { Device } from "../_types/device.types";
import { DeviceTableRowActions } from "./table/DeviceTableRowActions";

const helper = createDataTableColumnHelper<Device>();

const SECONDARY_LINE = "text-xs leading-4.5 text-muted-foreground";

// L'API trie, cherche et filtre : chaque id de colonne triable est un champ qu'elle sait trier
// (`displayName`, `model`, `assignedToName`, `battery`, `lastHeartbeatAt`). Le statut ne se trie pas ; il se filtre par les onglets.
// La colonne « Dernier contact » trie aussi sur `presenceChangedAt` (voir `useDevicesTable`).
export const deviceColumns = [
  // Le nom de l'appareil (sinon son modèle), et son n° de série dessous.
  helper.accessor((device) => toDeviceName(device), {
    id: "displayName",
    header: DEVICE.table.device,
    // L'identité de la ligne : la seule colonne de données qu'on ne masque pas (comme « Réseau » au Wi-Fi).
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{toDeviceName(row.original)}</span>
        {row.original.displayName && <span className={SECONDARY_LINE}>{`Android ID : ${row.original.androidId}`}</span>}
      </div>
    ),
  }),
  // Le modèle, et sa marque dessous.
  helper.accessor((device) => device.model ?? "", {
    id: "model",
    header: DEVICE.table.model,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.model ?? DEVICE.noModel}</span>
        {row.original.brand && <span className={SECONDARY_LINE}>{row.original.brand}</span>}
      </div>
    ),
  }),
  helper.accessor((device) => device.assignedToName ?? "", {
    id: "assignedToName",
    header: DEVICE.table.user,
    cell: ({ row }) =>
      row.original.assignedToName ?? <span className="text-muted-foreground">{DEVICE.unassigned}</span>,
  }),
  helper.accessor("status", {
    header: DEVICE.table.status,
    enableSorting: false,
    // Un appareil bloqué garde sa présence MQTT, mais le serveur refuse ses requêtes : c'est ce qu'on affiche.
    cell: ({ row }) => <DeviceStatusBadge status={isDeviceBlocked(row.original) ? "blocked" : row.original.status} />,
  }),
  helper.accessor((device) => device.battery ?? -1, {
    id: "battery",
    header: DEVICE.table.battery,
    cell: ({ row }) => <BatteryMeter value={row.original.battery} />,
  }),
  helper.accessor((device) => toLastSeenTime(device) ?? 0, {
    id: "lastHeartbeatAt",
    header: DEVICE.table.lastContact,
    cell: ({ row }) => <span className="text-muted-foreground">{toLastContactLabel(row.original)}</span>,
  }),
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">{DEVICE.table.actions}</span>,
    enableHiding: false,
    cell: ({ row }) => <DeviceTableRowActions device={row.original} />,
  }),
];
