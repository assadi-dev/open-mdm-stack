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
import { toBlockManyTitle, toBlockTitle, toDeviceName } from "../../_services/devices.utils";
import type { Device } from "../../_types/device.types";

type BlockDeviceDialogProps = {
  // Un appareil (action de ligne) ou plusieurs (barre de sélection).
  devices: Device[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlocked?: () => void;
};

export const BlockDeviceDialog = ({ devices, open, onOpenChange, onBlocked }: BlockDeviceDialogProps) => {
  const { block, blockMany } = useDeviceMutation();
  const [device] = devices;
  const isMany = devices.length > 1;
  const text = DEVICE.dialog[isMany ? "blockMany" : "block"];

  // La boîte se ferme à la réussite seulement : en cas d'échec, elle reste et le toast explique.
  const onBlock = () => {
    const onSuccess = () => {
      onOpenChange(false);
      onBlocked?.();
    };

    if (isMany) blockMany.mutate(devices.map(({ id }) => id), { onSuccess });
    else if (device) block.mutate(device.id, { onSuccess });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isMany ? toBlockManyTitle(devices.length) : toBlockTitle(device ? toDeviceName(device) : "")}</AlertDialogTitle>
          <AlertDialogDescription>{text.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ACTION_LABELS.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={block.isPending || blockMany.isPending} onClick={onBlock}>
            {text.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
