import { createDataTableColumnHelper } from "@/components/data-table/data-table-features";
import { BatteryMeter } from "@/components/devices/BatteryMeter";
import { DeviceRowActions } from "@/components/devices/DeviceRowActions";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { DEVICE } from "@/constants/device";
import { STATUS } from "@/constants/status";
import { formatDeviceName, formatRelativeTime } from "@/lib/format";
import type { Device } from "../_types/device.types";

const helper = createDataTableColumnHelper<Device>();

const SECONDARY_LINE = "text-xs leading-4.5 text-muted-foreground";

// La recherche et le tri portent sur la valeur d'accesseur : l'appareil expose son nom et son n° de série, le statut son libellé,
// la batterie un nombre (−1 sans mesure, pour reléguer ces lignes en fin de tri) et le contact sa date.
export const deviceColumns = [
  helper.accessor((device) => `${formatDeviceName(device.model, device.serial)} ${device.serial}`, {
    id: "device",
    header: DEVICE.table.device,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{formatDeviceName(row.original.model, row.original.serial)}</span>
        <span className={SECONDARY_LINE}>{`${DEVICE.serialPrefix} ${row.original.serial}`}</span>
      </div>
    ),
  }),
  helper.accessor("user", { header: DEVICE.table.user }),
  helper.accessor("group", {
    header: DEVICE.table.group,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.group}</span>
        <span className={SECONDARY_LINE}>{row.original.policy}</span>
      </div>
    ),
  }),
  helper.accessor((device) => STATUS[device.status].label, {
    id: "status",
    header: DEVICE.table.status,
    enableSorting: false,
    cell: ({ row }) => <DeviceStatusBadge status={row.original.status} />,
  }),
  helper.accessor((device) => device.battery ?? -1, {
    id: "battery",
    header: DEVICE.table.battery,
    enableGlobalFilter: false,
    cell: ({ row }) => <BatteryMeter value={row.original.battery} />,
  }),
  helper.accessor((device) => new Date(device.lastSeenAt).getTime(), {
    id: "lastSeenAt",
    header: DEVICE.table.lastContact,
    enableGlobalFilter: false,
    cell: (info) => <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>,
  }),
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">{DEVICE.table.actions}</span>,
    cell: ({ row }) => (
      <DeviceRowActions deviceName={formatDeviceName(row.original.model, row.original.serial)} />
    ),
  }),
];
