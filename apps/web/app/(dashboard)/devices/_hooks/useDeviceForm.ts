import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { deviceFormSchema } from "../_dto/device.dto";
import { toDeviceFormValues, toUpdateInput } from "../_services/devices.utils";
import type { Device, DeviceFormValues } from "../_types/device.types";
import { useDeviceMutation } from "./useDeviceMutation";

type UseDeviceFormOptions = {
  device: Device;
  onSuccess: () => void;
};

export const useDeviceForm = ({ device, onSuccess }: UseDeviceFormOptions) => {
  const { update } = useDeviceMutation();

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: toDeviceFormValues(device),
  });

  // La boîte de dialogue se ferme à la réussite seulement : en cas d'échec, la saisie reste et le toast explique.
  const onSubmit = form.handleSubmit((values) => update.mutate(toUpdateInput(device.id, values), { onSuccess }));

  return { form, onSubmit, isPending: update.isPending };
};
