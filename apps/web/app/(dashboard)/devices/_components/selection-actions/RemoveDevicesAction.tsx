"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ActionBarItem } from "@/components/action-bars/ActionBar";
import { DEVICE } from "@/constants/device";
import type { Device } from "../../_types/device.types";
import { DeleteDeviceDialog } from "../modals/DeleteDeviceDialog";

type RemoveDevicesActionProps = {
  devices: Device[];
  onDeleted: () => void;
};

// Après le clic, la barre de sélection se ferme et vide la sélection : on l'en empêche, pour que la sélection survive
// à l'annulation de la confirmation. La boîte est une sœur de l'item, montée dans la barre tant qu'elle reste ouverte.
export const RemoveDevicesAction = ({ devices, onDeleted }: RemoveDevicesActionProps) => {
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
        {DEVICE.button.deleteMany}
      </ActionBarItem>
      <DeleteDeviceDialog devices={devices} open={isConfirmOpen} onOpenChange={setConfirmOpen} onDeleted={onDeleted} />
    </>
  );
};
