"use client";

import { useState } from "react";
import { EllipsisVertical, Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/menus/DropdownMenu";
import { DEVICE } from "@/constants/device";
import { toDeviceName } from "../../_services/devices.utils";
import type { Device } from "../../_types/device.types";
import { DeviceFormDialog } from "../modals/DeviceFormDialog";

type DeviceTableRowActionsProps = {
  device: Device;
};

// Le menu d'une ligne du tableau. « Modifier » est branché ; le détail, l'actualisation et la suppression ne le sont pas encore.
// La boîte de dialogue est une sœur du menu, pas son enfant : le menu se démonte à la fermeture et emporterait la boîte avec lui.
// Le dashboard garde `components/devices/DeviceRowActions`, qui n'a que « Voir le détail ».
export const DeviceTableRowActions = ({ device }: DeviceTableRowActionsProps) => {
  const [isEditOpen, setEditOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${DEVICE.actionsFor} ${toDeviceName(device)}`} />}>
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye />
            {DEVICE.button.viewDetail}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RefreshCw />
            {DEVICE.button.refresh}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            {DEVICE.button.update}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            <Trash2 />
            {DEVICE.button.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeviceFormDialog open={isEditOpen} onOpenChange={setEditOpen} device={device} />
    </div>
  );
};
