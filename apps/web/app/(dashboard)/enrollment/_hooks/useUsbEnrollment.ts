import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { connectUsbDeviceApi, enrollUsbDeviceApi } from "../_services/enrollment.api";
import { toUsbEnrollmentInput } from "../_services/enrollment.utils";
import type { EnrollmentConfigFormValues, UsbEnrollmentStatus } from "../_types/enrollment.types";

// Le parcours de la carte « Connexion USB » : brancher l'appareil, l'enrôler avec les réglages du formulaire, se déconnecter.
// L'état vit dans les deux mutations : se déconnecter les remet à zéro.
export const useUsbEnrollment = (form: UseFormReturn<EnrollmentConfigFormValues>) => {
  const connection = useMutation({
    mutationFn: connectUsbDeviceApi,
    onSuccess: () => toast.success(ENROLLMENT.success.connect),
    onError: () => toast.error(ENROLLMENT.error.connect),
  });

  const enrollment = useMutation({
    mutationFn: enrollUsbDeviceApi,
    onSuccess: () => toast.success(ENROLLMENT.success.enroll),
    onError: () => toast.error(ENROLLMENT.error.enroll),
  });

  const device = connection.data;

  const toStatus = (): UsbEnrollmentStatus => {
    if (!device) return "idle";
    if (enrollment.isSuccess) return "enrolled";
    if (enrollment.isPending) return "enrolling";
    return "connected";
  };

  // Les réglages sont validés avant l'envoi : une erreur s'affiche sous son champ, dans la carte « Configuration ».
  const enroll = form.handleSubmit((values) => {
    if (device) enrollment.mutate(toUsbEnrollmentInput(values, device));
  });

  const disconnect = () => {
    connection.reset();
    enrollment.reset();
  };

  return {
    device,
    status: toStatus(),
    isConnecting: connection.isPending,
    connect: () => connection.mutate(),
    enroll,
    disconnect,
  };
};
