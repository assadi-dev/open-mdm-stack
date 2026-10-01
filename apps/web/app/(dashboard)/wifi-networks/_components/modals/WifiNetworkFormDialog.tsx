"use client";

import { Dialog, DialogContent } from "@/components/dialogs/Dialog";
import type { WifiNetwork } from "../../_types/wifi-network.types";
import { WifiNetworkForm } from "../forms/WifiNetworkForm";

type WifiNetworkFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Présent : la boîte modifie ce réseau. Absent : elle en ajoute un.
  network?: WifiNetwork;
};

// Le formulaire vit dans le contenu de la boîte, monté seulement à l'ouverture : chaque ouverture repart d'un formulaire vierge.
export const WifiNetworkFormDialog = ({ open, onOpenChange, network }: WifiNetworkFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
    <DialogContent>
      <WifiNetworkForm network={network} onClose={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);
