import type { z } from "zod";
import type { ENROLLMENT } from "@/constants/enrollment";
import type {
  ENROLLMENT_METHOD_KEYS,
  enrollmentCodeSchema,
  enrollmentConfigFormSchema,
  enrollmentOptionsSchema,
  enrollmentQrSchema,
  usbDeviceSchema,
  usbEnrollmentSchema,
} from "../_dto/enrollment.dto";

export type EnrollmentMethod = (typeof ENROLLMENT_METHOD_KEYS)[number];
export type EnrollmentOptions = z.infer<typeof enrollmentOptionsSchema>;
export type EnrollmentQr = z.infer<typeof enrollmentQrSchema>;
export type EnrollmentCode = z.infer<typeof enrollmentCodeSchema>;
export type UsbDevice = z.infer<typeof usbDeviceSchema>;
export type UsbEnrollment = z.infer<typeof usbEnrollmentSchema>;
export type EnrollmentConfigFormValues = z.infer<typeof enrollmentConfigFormSchema>;

// Un choix de liste déroulante du formulaire.
export type EnrollmentOption = {
  value: string;
  label: string;
};

// Ce que l'API reçoit pour générer un QR code ou enrôler un appareil : un champ absent laisse la valeur par défaut du
// serveur. `name` est le nom attribué à l'appareil enrôlé.
export type ProvisioningInput = {
  name: string;
  groupId: string;
  policyId: string;
  wifiId?: string;
  apkUrl?: string;
};

// L'enrôlement par USB vise l'appareil branché ; le Wi-Fi n'y a pas sa place, l'appareil est déjà configuré.
export type UsbEnrollmentInput = Omit<ProvisioningInput, "wifiId"> & {
  serial: string;
};

// Le parcours de la carte « Connexion USB » : rien de branché, branché, enrôlement en cours, enrôlé.
export type UsbEnrollmentStatus = "idle" | "connected" | "enrolling" | "enrolled";
export type UsbStep = keyof typeof ENROLLMENT.usb.steps;
export type UsbStepStatus = keyof typeof ENROLLMENT.usb.stepStatus;

// Les actions de copie, qui partagent leur hook et leurs messages.
export type CopyAction = "copyCode";
