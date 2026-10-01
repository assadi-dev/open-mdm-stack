"use client";

import { Wifi } from "lucide-react";
import { AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from "@/components/dialogs/AlertDialog";
import { ModalHeader } from "@/components/modals/ModalHeader";
import { ACTION_LABELS } from "@/constants/actions";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { useWifiNetworkForm } from "../../_hooks/useWifiNetworkForm";
import type { WifiNetwork } from "../../_types/wifi-network.types";
import { WifiNetworkFormFields } from "./WifiNetworkFormFields";

type WifiNetworkFormProps = {
  network?: WifiNetwork;
  onClose: () => void;
};

export const WifiNetworkForm = ({ network, onClose }: WifiNetworkFormProps) => {
  const text = WIFI_NETWORK.dialog[network ? "update" : "create"];
  const { form, onSubmit, isPending } = useWifiNetworkForm({ network, onSuccess: onClose });

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <ModalHeader icon={Wifi} title={text.title} description={text.description} />
      <WifiNetworkFormFields form={form} isEditing={!!network} />
      <AlertDialogFooter>
        <AlertDialogCancel>{ACTION_LABELS.cancel}</AlertDialogCancel>
        <AlertDialogAction type="submit" disabled={isPending}>
          {text.submit}
        </AlertDialogAction>
      </AlertDialogFooter>
    </form>
  );
};
