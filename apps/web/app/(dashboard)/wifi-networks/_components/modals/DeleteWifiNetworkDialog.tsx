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
import { useWifiNetworkMutation } from "../../_hooks/useWifiNetworkMutation";
import { toDeleteManyTitle, toDeleteTitle } from "../../_services/wifi-networks.utils";
import type { WifiNetwork } from "../../_types/wifi-network.types";

type DeleteWifiNetworkDialogProps = {
  // Un réseau (action de ligne) ou plusieurs (barre de sélection).
  networks: WifiNetwork[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export const DeleteWifiNetworkDialog = ({ networks, open, onOpenChange, onDeleted }: DeleteWifiNetworkDialogProps) => {
  const { remove, removeMany } = useWifiNetworkMutation();
  const [network] = networks;
  const isMany = networks.length > 1;
  const text = WIFI_NETWORK.dialog[isMany ? "deleteMany" : "delete"];

  const onDelete = () => {
    const onSuccess = () => {
      onOpenChange(false);
      onDeleted?.();
    };

    if (isMany) removeMany.mutate(networks.map(({ id }) => id), { onSuccess });
    else if (network) remove.mutate(network.id, { onSuccess });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isMany ? toDeleteManyTitle(networks.length) : toDeleteTitle(network?.ssid ?? "")}</AlertDialogTitle>
          <AlertDialogDescription>{text.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ACTION_LABELS.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending || removeMany.isPending}
            onClick={onDelete}
          >
            {text.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
