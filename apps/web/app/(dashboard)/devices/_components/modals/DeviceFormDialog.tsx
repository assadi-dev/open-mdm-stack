"use client";

import { Dialog, DialogContent } from "@/components/dialogs/Dialog";
import type { Device } from "../../_types/device.types";
import { DeviceForm } from "../forms/DeviceForm";

type DeviceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device;
};

// Le formulaire vit dans le contenu de la boîte, monté seulement à l'ouverture : chaque ouverture repart de l'appareil tel qu'il est.
export const DeviceFormDialog = ({ open, onOpenChange, device }: DeviceFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
    <DialogContent>
      <DeviceForm device={device} onClose={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);
