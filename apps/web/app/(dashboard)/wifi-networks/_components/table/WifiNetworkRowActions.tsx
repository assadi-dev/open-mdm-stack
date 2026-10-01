"use client";

import { useState } from "react";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/menus/DropdownMenu";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import type { WifiNetwork } from "../../_types/wifi-network.types";
import { DeleteWifiNetworkDialog } from "../modals/DeleteWifiNetworkDialog";
import { WifiNetworkFormDialog } from "../modals/WifiNetworkFormDialog";

type WifiNetworkRowActionsProps = {
  network: WifiNetwork;
};

// Les boîtes de dialogue sont des sœurs du menu, pas ses enfants : le menu se démonte à la fermeture et emporterait la boîte avec lui.
export const WifiNetworkRowActions = ({ network }: WifiNetworkRowActionsProps) => {
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`${WIFI_NETWORK.actionsFor} ${network.ssid}`} />}
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            {WIFI_NETWORK.button.update}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            {WIFI_NETWORK.button.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <WifiNetworkFormDialog open={isEditOpen} onOpenChange={setEditOpen} network={network} />
      <DeleteWifiNetworkDialog networks={[network]} open={isDeleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
};
