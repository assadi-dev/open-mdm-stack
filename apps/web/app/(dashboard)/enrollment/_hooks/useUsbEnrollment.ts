import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { connectUsbDeviceApi, enrollUsbDeviceApi } from "../_services/enrollment.api";
import { isUsbSupported, toUsbEnrollmentInput } from "../_services/enrollment.utils";
import type { EnrollmentConfigFormValues, UsbEnrollmentStatus } from "../_types/enrollment.types";

// Le temps de lire le message et de cliquer sur l'action : plus long qu'un toast ordinaire (4 s).
const UNSUPPORTED_TOAST_DURATION = 8000;

// Le parcours de la carte « Connexion USB » : brancher l'appareil, l'enrôler avec les réglages du formulaire, se déconnecter.
// L'état vit dans les deux mutations : se déconnecter les remet à zéro.
// `onInstallWithCode` : l'installation à proposer quand ce navigateur ne sait pas faire d'USB.
export const useUsbEnrollment = (form: UseFormReturn<EnrollmentConfigFormValues>, onInstallWithCode: () => void) => {
  const connection = useMutation({
    mutationFn: connectUsbDeviceApi,
    // Fenêtre de sélection refermée sans choix : pas d'appareil, donc ni succès ni échec à annoncer.
    onSuccess: (device) => {
      if (device) toast.success(ENROLLMENT.success.connect);
    },
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

  // Le navigateur est vérifié avant toute demande d'accès : sans WebUSB, on l'explique et on propose le code à la place.
  const connect = () => {
    if (!isUsbSupported()) {
      toast.info(ENROLLMENT.usb.unsupported.message, {
        description: ENROLLMENT.usb.unsupported.recommendation,
        duration: UNSUPPORTED_TOAST_DURATION,
        action: { label: ENROLLMENT.button.installWithCode, onClick: onInstallWithCode },
      });
      return;
    }
    connection.mutate();
  };

  return {
    device,
    status: toStatus(),
    isConnecting: connection.isPending,
    connect,
    enroll,
    disconnect,
  };
};
