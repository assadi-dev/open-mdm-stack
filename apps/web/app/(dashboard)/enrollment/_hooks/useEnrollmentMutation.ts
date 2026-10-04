import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { applyDeviceOwnerApi, createEnrollmentQrApi, fetchEnrollmentCodeApi } from "../_services/enrollment.api";
import { ENROLLMENTS } from "../_services/enrollment.queries";

type EnrollmentAction = keyof typeof ENROLLMENT.success & keyof typeof ENROLLMENT.error;

export const useEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  // Un nouveau code remplace l'ancien dans le cache : la carte l'affiche sans nouvel appel (un nouvel appel en
  // générerait encore un autre).
  const afterMutation = (action: EnrollmentAction, queryKey?: QueryKey) => ({
    onSuccess: (data: unknown) => {
      if (queryKey) queryClient.setQueryData(queryKey, data);
      toast.success(ENROLLMENT.success[action]);
    },
    onError: () => toast.error(ENROLLMENT.error[action]),
  });

  // Le QR code généré est la donnée de la mutation (`generateQr.data`) : il vit tant que la page est ouverte.
  const generateQr = useMutation({
    mutationFn: createEnrollmentQrApi,
    ...afterMutation("generateQr"),
  });

  const regenerateCode = useMutation({
    mutationFn: () => fetchEnrollmentCodeApi({ isNew: true }),
    ...afterMutation("regenerateCode", ENROLLMENTS.code),
  });

  const applyDeviceOwner = useMutation({
    mutationFn: applyDeviceOwnerApi,
    ...afterMutation("applyDeviceOwner"),
  });

  return { generateQr, regenerateCode, applyDeviceOwner };
};
