"use client";

import { useState } from "react";
import { Ban, EllipsisVertical, Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/menus/DropdownMenu";
import { DEVICE } from "@/constants/device";
import { useDeviceMutation } from "../../_hooks/useDeviceMutation";
import { isDeviceBlocked, toDeviceName } from "../../_services/devices.utils";
import type { Device } from "../../_types/device.types";
import { BlockDeviceDialog } from "../modals/BlockDeviceDialog";
import { DeleteDeviceDialog } from "../modals/DeleteDeviceDialog";
import { DeviceFormDialog } from "../modals/DeviceFormDialog";

type DeviceTableRowActionsProps = {
  device: Device;
};

// Le menu d'une ligne du tableau. « Modifier », « Supprimer », « Bloquer » et « Actualiser » sont branchés ; le détail ne l'est
// pas encore. L'actualisation attend l'appareil (15 s au plus) : l'item reste grisé tant qu'elle dure, le résultat arrive par un toast.
// Un appareil bloqué ne peut plus joindre le serveur : « Synchroniser » et « Bloquer » sont grisés.
// Les boîtes de dialogue sont des sœurs du menu, pas ses enfants : le menu se démonte à la fermeture et emporterait la boîte avec lui.
// Le dashboard garde `components/devices/DeviceRowActions`, qui n'a que « Voir le détail ».
export const DeviceTableRowActions = ({ device }: DeviceTableRowActionsProps) => {
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isBlockOpen, setBlockOpen] = useState(false);
  const { refresh } = useDeviceMutation();
  const isBlocked = isDeviceBlocked(device);

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
          <DropdownMenuItem disabled={isBlocked || refresh.isPending} onClick={() => refresh.mutate(device.id)}>
            <RefreshCw />
            {DEVICE.button.refresh}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            {DEVICE.button.update}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={isBlocked} onClick={() => setBlockOpen(true)}>
            <Ban />
            {DEVICE.button.block}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            {DEVICE.button.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeviceFormDialog open={isEditOpen} onOpenChange={setEditOpen} device={device} />
      <BlockDeviceDialog devices={[device]} open={isBlockOpen} onOpenChange={setBlockOpen} />
      <DeleteDeviceDialog devices={[device]} open={isDeleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
};
