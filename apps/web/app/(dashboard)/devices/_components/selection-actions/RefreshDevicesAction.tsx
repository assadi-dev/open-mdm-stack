"use client";

import { RefreshCw } from "lucide-react";
import { ActionBarItem } from "@/components/action-bars/ActionBar";
import { DEVICE } from "@/constants/device";
import { useDeviceMutation } from "../../_hooks/useDeviceMutation";
import type { Device } from "../../_types/device.types";

type RefreshDevicesActionProps = {
  devices: Device[];
};

// Après le clic, la barre se ferme et la sélection est vidée (comportement par défaut d'un `ActionBarItem`) : le toast
// prend le relais. La mutation vit dans le hook, pas dans la barre : elle va jusqu'au bout et recharge la liste même
// quand la barre est déjà démontée. Un seul appareil coché s'actualise comme depuis le menu de sa ligne.
export const RefreshDevicesAction = ({ devices }: RefreshDevicesActionProps) => {
  const { refresh, refreshMany } = useDeviceMutation();

  const handleSelect = () => {
    const [first] = devices;
    if (devices.length === 1 && first) {
      refresh.mutate(first.id);
    } else {
      refreshMany.mutate(devices.map(({ id }) => id));
    }
  };

  return (
    <ActionBarItem onSelect={handleSelect}>
      <RefreshCw />
      {DEVICE.button.refreshMany}
    </ActionBarItem>
  );
};
