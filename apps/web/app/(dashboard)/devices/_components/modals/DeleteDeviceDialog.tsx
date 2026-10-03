"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dialogs/AlertDialog";
import { ACTION_LABELS } from "@/constants/actions";
import { DEVICE } from "@/constants/device";
import { useDeviceMutation } from "../../_hooks/useDeviceMutation";
import { toDeleteManyTitle, toDeleteTitle, toDeviceName } from "../../_services/devices.utils";
import type { Device } from "../../_types/device.types";

type DeleteDeviceDialogProps = {
  // Un appareil (action de ligne) ou plusieurs (barre de sélection).
  devices: Device[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export const DeleteDeviceDialog = ({ devices, open, onOpenChange, onDeleted }: DeleteDeviceDialogProps) => {
  const { remove, removeMany } = useDeviceMutation();
  const [device] = devices;
  const isMany = devices.length > 1;
  const text = DEVICE.dialog[isMany ? "deleteMany" : "delete"];

  // La boîte se ferme à la réussite seulement : en cas d'échec, elle reste et le toast explique.
  const onDelete = () => {
    const onSuccess = () => {
      onOpenChange(false);
      onDeleted?.();
    };

    if (isMany) removeMany.mutate(devices.map(({ id }) => id), { onSuccess });
    else if (device) remove.mutate(device.id, { onSuccess });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isMany ? toDeleteManyTitle(devices.length) : toDeleteTitle(device ? toDeviceName(device) : "")}</AlertDialogTitle>
          <AlertDialogDescription>{text.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ACTION_LABELS.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={remove.isPending || removeMany.isPending} onClick={onDelete}>
            {text.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
