"use client";

import { AlertDialog, AlertDialogContent } from "@/components/dialogs/AlertDialog";
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
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <WifiNetworkForm network={network} onClose={() => onOpenChange(false)} />
    </AlertDialogContent>
  </AlertDialog>
);
