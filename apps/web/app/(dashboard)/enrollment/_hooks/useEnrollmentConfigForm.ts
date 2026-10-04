import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { enrollmentConfigFormSchema } from "../_dto/enrollment.dto";
import { NO_WIFI, toConfigFormValues, toProvisioningInput } from "../_services/enrollment.utils";
import type { EnrollmentConfigFormValues, EnrollmentOptions } from "../_types/enrollment.types";
import { useEnrollmentMutation } from "./useEnrollmentMutation";

const EMPTY_CONFIG: EnrollmentConfigFormValues = { namePattern: "", groupId: "", policyId: "", wifiId: NO_WIFI, apkUrl: "" };

// Le formulaire « Configuration » sert les deux méthodes : sa soumission régénère le QR code ; l'enrôlement par USB
// le valide et lit ses valeurs (`useUsbEnrollment`).
export const useEnrollmentConfigForm = (options?: EnrollmentOptions) => {
  const { regenerateQr } = useEnrollmentMutation();

  // Les valeurs par défaut arrivent avec les choix du serveur ; d'ici là, `EMPTY_CONFIG` garde les listes déroulantes
  // contrôlées (sinon elles ignoreraient les valeurs arrivées ensuite). Pas de `resetOptions.keepDirtyValues` : React Hook
  // Form l'applique à chaque `reset()`, « Réinitialiser » garderait alors la saisie.
  const form = useForm<EnrollmentConfigFormValues>({
    resolver: zodResolver(enrollmentConfigFormSchema),
    defaultValues: EMPTY_CONFIG,
    values: options ? toConfigFormValues(options) : undefined,
  });

  const onRegenerateQr = form.handleSubmit((values) => regenerateQr.mutate(toProvisioningInput(values)));

  const onReset = () => {
    if (options) form.reset(toConfigFormValues(options));
  };

  return { form, onRegenerateQr, onReset, isRegeneratingQr: regenerateQr.isPending };
};
