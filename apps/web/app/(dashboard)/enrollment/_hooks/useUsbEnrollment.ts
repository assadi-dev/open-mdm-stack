import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { useAdb } from "@/hooks/useAdb";
import { closeAdbSession, isAdbSupported, isDeviceBusyError, openAdbSession } from "@/lib/adb/adb-session";
import { enrollUsbDeviceApi } from "../_services/enrollment.api";
import { toUsbDevice, toUsbEnrollmentInput } from "../_services/enrollment.utils";
import type { EnrollmentConfigFormValues, UsbEnrollmentStatus } from "../_types/enrollment.types";

// Le temps de lire le message et de cliquer sur l'action : plus long qu'un toast ordinaire (4 s).
const UNSUPPORTED_TOAST_DURATION = 8000;

// Le parcours de la carte « Connexion USB » : brancher l'appareil, l'enrôler avec les réglages du formulaire, se déconnecter.
// L'appareil connecté n'est pas à la carte : sa session ADB vit dans `AdbProvider`, il reste branché quand on change de page.
// `onInstallWithCode` : l'installation à proposer quand ce navigateur ne sait pas faire d'USB.
export const useUsbEnrollment = (form: UseFormReturn<EnrollmentConfigFormValues>, onInstallWithCode: () => void) => {
  const { session, setSession } = useAdb();
  const device = useMemo(() => (session ? toUsbDevice(session.usbDevice) : null), [session]);

  const connection = useMutation({
    mutationFn: openAdbSession,
    // Fenêtre de sélection refermée sans choix : pas d'appareil, donc ni succès ni échec à annoncer.
    onSuccess: (opened) => {
      if (!opened) return;
      setSession(opened);
      toast.success(ENROLLMENT.success.connect);
    },
    onError: (error) => toast.error(isDeviceBusyError(error) ? ENROLLMENT.error.deviceBusy : ENROLLMENT.error.connect),
  });

  // La session reste en place si la fermeture échoue : « Déconnecter » peut être relancé.
  const disconnection = useMutation({
    mutationFn: closeAdbSession,
    onSuccess: () => {
      setSession(null);
      toast.success(ENROLLMENT.success.disconnect);
    },
    onError: () => toast.error(ENROLLMENT.error.disconnect),
  });

  const enrollment = useMutation({
    mutationFn: enrollUsbDeviceApi,
    onSuccess: () => toast.success(ENROLLMENT.success.enroll),
    onError: () => toast.error(ENROLLMENT.error.enroll),
  });

  // Sans appareil (déconnecté, ou câble débranché), l'enrôlement précédent ne compte plus pour le prochain appareil.
  const { reset: resetEnrollment } = enrollment;
  useEffect(() => {
    if (!session) resetEnrollment();
  }, [session, resetEnrollment]);

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

  // Le navigateur est vérifié avant toute demande d'accès : sans WebUSB, on l'explique et on propose le code à la place.
  const connect = () => {
    if (!isAdbSupported()) {
      toast.info(ENROLLMENT.usb.unsupported.message, {
        description: ENROLLMENT.usb.unsupported.recommendation,
        duration: UNSUPPORTED_TOAST_DURATION,
        action: { label: ENROLLMENT.button.installWithCode, onClick: onInstallWithCode },
      });
      return;
    }
    connection.mutate();
  };

  const disconnect = () => {
    if (session) disconnection.mutate(session);
  };

  return {
    device,
    status: toStatus(),
    isConnecting: connection.isPending,
    isDisconnecting: disconnection.isPending,
    connect,
    enroll,
    disconnect,
  };
};
