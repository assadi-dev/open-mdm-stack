import { createDataTableColumnHelper } from "@/components/data-table/data-table-features";
import { BatteryMeter } from "@/components/devices/BatteryMeter";
import { DeviceRowActions } from "@/components/devices/DeviceRowActions";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { DEVICE } from "@/constants/device";
import { STATUS } from "@/constants/status";
import { formatDeviceName, formatRelativeTime } from "@/lib/format";
import type { RecentDevice } from "../_types/dashboard.types";

const helper = createDataTableColumnHelper<RecentDevice>();

// La recherche et le tri portent sur la valeur d'accesseur : le statut expose son libellé, le contact sa date.
export const recentDevicesColumns = [
  helper.accessor((device) => formatDeviceName(device.model, device.serial), {
    id: "device",
    header: DEVICE.table.device,
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  helper.accessor("user", { header: DEVICE.table.user, enableSorting: false }),
  helper.accessor("group", { header: DEVICE.table.group, enableSorting: false }),
  helper.accessor((device) => STATUS[device.status].label, {
    id: "status",
    header: DEVICE.table.status,
    enableSorting: false,
    cell: (info) => <DeviceStatusBadge status={info.row.original.status} />,
  }),
  helper.accessor("battery", {
    header: DEVICE.table.battery,
    enableSorting: false,
    enableGlobalFilter: false,
    cell: (info) => <BatteryMeter value={info.getValue()} />,
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
