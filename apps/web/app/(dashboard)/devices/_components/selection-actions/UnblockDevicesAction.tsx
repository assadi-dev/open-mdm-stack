"use client";

import { ShieldCheck } from "lucide-react";
import { ActionBarItem } from "@/components/action-bars/ActionBar";
import { DEVICE } from "@/constants/device";
import { useDeviceMutation } from "../../_hooks/useDeviceMutation";
import type { Device } from "../../_types/device.types";

type UnblockDevicesActionProps = {
  // Les appareils bloqués de la sélection seulement.
  devices: Device[];
};

// Sans confirmation : débloquer ne perd rien. Après le clic, la barre se ferme et la sélection est vidée (comportement
// par défaut d'un `ActionBarItem`) ; la mutation vit dans le hook et va au bout même une fois la barre démontée. Un seul
// appareil se débloque comme depuis le menu de sa ligne.
export const UnblockDevicesAction = ({ devices }: UnblockDevicesActionProps) => {
  const { unblock, unblockMany } = useDeviceMutation();

  const handleSelect = () => {
    const [first] = devices;
    if (devices.length === 1 && first) {
      unblock.mutate(first.id);
    } else {
      unblockMany.mutate(devices.map(({ id }) => id));
    }
  };

  return (
    <ActionBarItem onSelect={handleSelect}>
      <ShieldCheck />
      {DEVICE.button.unblockMany}
    </ActionBarItem>
  );
};
