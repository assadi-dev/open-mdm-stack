"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ActionBarItem } from "@/components/action-bars/ActionBar";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import type { WifiNetwork } from "../../_types/wifi-network.types";
import { DeleteWifiNetworkDialog } from "../modals/DeleteWifiNetworkDialog";

type RemoveWifiNetworksActionProps = {
  networks: WifiNetwork[];
  onDeleted: () => void;
};

// Après le clic, la barre de sélection se ferme et vide la sélection : on l'en empêche, pour que la sélection survive
// à l'annulation de la confirmation. La boîte est une sœur de l'item, montée dans la barre tant qu'elle reste ouverte.
export const RemoveWifiNetworksAction = ({ networks, onDeleted }: RemoveWifiNetworksActionProps) => {
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ActionBarItem
        variant="destructive"
        onSelect={(event) => {
          event.preventDefault();
          setConfirmOpen(true);
        }}
      >
        <Trash2 />
        {WIFI_NETWORK.button.deleteMany}
      </ActionBarItem>
      <DeleteWifiNetworkDialog
        networks={networks}
        open={isConfirmOpen}
        onOpenChange={setConfirmOpen}
        onDeleted={onDeleted}
      />
    </>
  );
};
