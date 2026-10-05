"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { ActionBarItem } from "@/components/action-bars/ActionBar";
import { DEVICE } from "@/constants/device";
import type { Device } from "../../_types/device.types";
import { BlockDeviceDialog } from "../modals/BlockDeviceDialog";

type BlockDevicesActionProps = {
  devices: Device[];
  onBlocked: () => void;
};

// Comme la suppression : la barre et la sélection survivent à l'annulation de la confirmation. Les appareils déjà
// bloqués de la sélection sont envoyés aussi : l'API les ignore et garde leur date de blocage.
export const BlockDevicesAction = ({ devices, onBlocked }: BlockDevicesActionProps) => {
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
        <Ban />
        {DEVICE.button.blockMany}
      </ActionBarItem>
      <BlockDeviceDialog devices={devices} open={isConfirmOpen} onOpenChange={setConfirmOpen} onBlocked={onBlocked} />
    </>
  );
};
