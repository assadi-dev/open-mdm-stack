import type { Adb } from "@yume-chan/adb";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { useAdb } from "@/hooks/useAdb";
import { installApk } from "@/lib/adb/adb-package";
import { closeAdbSession, isAdbSupported, isDeviceBusyError, openAdbSession } from "@/lib/adb/adb-session";
import { activateUsbDeviceOwnerApi, downloadAgentApi, enrollUsbDeviceApi } from "../_services/enrollment.api";
import {
  USB_STEPS,
  UsbStepError,
  toCurrentUsbStep,
  toUsbDevice,
  toUsbEnrollmentInput,
  toUsbStepStatuses,
} from "../_services/enrollment.utils";
import type {
  EnrollmentConfigFormValues,
  UsbEnrollmentInput,
  UsbEnrollmentStatus,
  UsbInstallPhase,
  UsbStep,
  UsbStepLabels,
} from "../_types/enrollment.types";

// Le temps de lire le message et de cliquer sur l'action : plus long qu'un toast ordinaire (4 s).
const UNSUPPORTED_TOAST_DURATION = 8000;

// `onInstallPhase` : « Installer l'agent » annonce le téléchargement, puis l'installation, pour le badge de l'étape.
const runStep = async (
  step: UsbStep,
  adb: Adb,
  input: UsbEnrollmentInput,
  onInstallPhase: (phase: UsbInstallPhase | null) => void,
) => {
  switch (step) {
    case "install": {
      onInstallPhase("download");
      const apk = await downloadAgentApi(input.apkUrl);
      onInstallPhase("install");
      return installApk(adb, apk);
    }
    case "enroll":
      return enrollUsbDeviceApi(adb, input);
    case "deviceOwner":
      return activateUsbDeviceOwnerApi();
  }
};

type EnrollmentRun = {
  adb: Adb;
  input: UsbEnrollmentInput;
  // Les étapes à faire : celles déjà faites ne sont pas rejouées après un échec.
  steps: UsbStep[];
};

// Le parcours de la carte « Connexion USB » : brancher l'appareil, l'enrôler avec les réglages du formulaire, se déconnecter.
// L'appareil connecté n'est pas à la carte : sa session ADB vit dans `AdbProvider`, il reste branché quand on change de page.
// `onInstallWithCode` : l'installation à proposer quand ce navigateur ne sait pas faire d'USB.
export const useUsbEnrollment = (form: UseFormReturn<EnrollmentConfigFormValues>, onInstallWithCode: () => void) => {
  const { session, setSession } = useAdb();
  const device = useMemo(() => (session ? toUsbDevice(session.usbDevice) : null), [session]);
  const [doneSteps, setDoneSteps] = useState<UsbStep[]>([]);
  const [installPhase, setInstallPhase] = useState<UsbInstallPhase | null>(null);

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

  // Les étapes se font l'une après l'autre ; chacune réussie est retenue, pour reprendre à celle qui a échoué.
  const enrollment = useMutation({
    mutationFn: async ({ adb, input, steps }: EnrollmentRun) => {
      for (const step of steps) {
        try {
          await runStep(step, adb, input, setInstallPhase);
        } catch (error) {
          throw new UsbStepError(step, error);
        } finally {
          setInstallPhase(null);
        }
        setDoneSteps((done) => [...done, step]);
      }
    },
    onSuccess: () => toast.success(ENROLLMENT.success.enroll),
    onError: (error) => toast.error(ENROLLMENT.error[error instanceof UsbStepError ? error.step : "enroll"]),
  });

  // Sans appareil (déconnecté, ou câble débranché), ce qui a été fait ne compte plus pour le prochain appareil.
  const { reset: resetEnrollment } = enrollment;
  useEffect(() => {
    if (session) return;
    setDoneSteps([]);
    resetEnrollment();
  }, [session, resetEnrollment]);

  const steps = toUsbStepStatuses(doneSteps, enrollment.isPending);
  const stepLabels: UsbStepLabels = installPhase ? { install: ENROLLMENT.usb.installPhase[installPhase] } : {};
  const isEnrolled = doneSteps.length === USB_STEPS.length;

  const toStatus = (): UsbEnrollmentStatus => {
    if (!device) return "idle";
    if (isEnrolled) return "enrolled";
    if (enrollment.isPending) return "enrolling";
    return "connected";
  };

  // Les réglages sont validés avant l'envoi : une erreur s'affiche sous son champ, dans la carte « Configuration ».
  const enroll = form.handleSubmit((values) => {
    if (!session || !device) return;
    enrollment.mutate({
      adb: session.adb,
      input: toUsbEnrollmentInput(values, device),
      steps: USB_STEPS.filter((step) => !doneSteps.includes(step)),
    });
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
    steps,
    stepLabels,
    currentStep: toCurrentUsbStep(doneSteps),
    isConnecting: connection.isPending,
    isDisconnecting: disconnection.isPending,
    connect,
    enroll,
    disconnect,
  };
};
