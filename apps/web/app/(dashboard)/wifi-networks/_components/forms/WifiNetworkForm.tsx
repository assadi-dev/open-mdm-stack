"use client";

import { Wifi } from "lucide-react";
import { ModalFormFooter } from "@/components/modals/ModalFormFooter";
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
      <ModalFormFooter
        labelCancel={ACTION_LABELS.cancel}
        labelSubmit={text.submit}
        labelSubmitting={text.submitting}
        isLoading={isPending}
      />
    </form>
  );
};
