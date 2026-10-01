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
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { useWifiNetworkMutation } from "../_hooks/useWifiNetworkMutation";
import { toDeleteTitle } from "../_services/wifi-networks.utils";
import type { WifiNetwork } from "../_types/wifi-network.types";

type DeleteWifiNetworkDialogProps = {
  network: WifiNetwork;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DeleteWifiNetworkDialog = ({ network, open, onOpenChange }: DeleteWifiNetworkDialogProps) => {
  const { remove } = useWifiNetworkMutation();
  const text = WIFI_NETWORK.dialog.delete;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{toDeleteTitle(network.ssid)}</AlertDialogTitle>
          <AlertDialogDescription>{text.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ACTION_LABELS.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate(network.id, { onSuccess: () => onOpenChange(false) })}
          >
            {text.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
