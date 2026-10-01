"use client";

import { Wifi } from "lucide-react";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dialogs/AlertDialog";
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
      <AlertDialogHeader>
        <div className="flex w-full items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary"
          >
            <Wifi className="size-5" />
          </span>
          <AlertDialogTitle>{text.title}</AlertDialogTitle>
        </div>
        <AlertDialogDescription>{text.description}</AlertDialogDescription>
      </AlertDialogHeader>
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
