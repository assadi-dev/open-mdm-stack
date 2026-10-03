"use client";

import { Smartphone } from "lucide-react";
import { ModalFormFooter } from "@/components/modals/ModalFormFooter";
import { ModalHeader } from "@/components/modals/ModalHeader";
import { ACTION_LABELS } from "@/constants/actions";
import { DEVICE } from "@/constants/device";
import { useDeviceForm } from "../../_hooks/useDeviceForm";
import type { Device } from "../../_types/device.types";
import { DeviceFormFields } from "./DeviceFormFields";

type DeviceFormProps = {
  device: Device;
  onClose: () => void;
};

export const DeviceForm = ({ device, onClose }: DeviceFormProps) => {
  const text = DEVICE.dialog.update;
  const { form, onSubmit, isPending } = useDeviceForm({ device, onSuccess: onClose });

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <ModalHeader icon={Smartphone} title={text.title} description={text.description} />
      <DeviceFormFields form={form} namePlaceholder={device.model ?? undefined} />
      <ModalFormFooter
        labelCancel={ACTION_LABELS.cancel}
        labelSubmit={text.submit}
        labelSubmitting={text.submitting}
        isLoading={isPending}
      />
    </form>
  );
};
