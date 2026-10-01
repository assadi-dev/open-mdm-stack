"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/buttons/Button";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { WifiNetworkFormDialog } from "./modals/WifiNetworkFormDialog";

export const WifiNetworksActionsBar = () => {
  const [isCreateOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-[1.375rem] leading-7 font-semibold tracking-[-0.4px]">{WIFI_NETWORK.page.section}</h2>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus />
        {WIFI_NETWORK.button.create}
      </Button>
      <WifiNetworkFormDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};
