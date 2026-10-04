import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { applyDeviceOwnerApi, fetchEnrollmentCodeApi, fetchEnrollmentQrApi } from "../_services/enrollment.api";
import { ENROLLMENTS } from "../_services/enrollment.queries";
import type { ProvisioningInput } from "../_types/enrollment.types";

type EnrollmentAction = keyof typeof ENROLLMENT.success & keyof typeof ENROLLMENT.error;

export const useEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  // Une régénération renvoie le nouveau QR code ou le nouveau code : il remplace l'ancien dans le cache, la carte
  // l'affiche sans nouvel appel (un nouvel appel en générerait encore un autre).
  const afterMutation = (action: EnrollmentAction, queryKey?: QueryKey) => ({
    onSuccess: (data: unknown) => {
      if (queryKey) queryClient.setQueryData(queryKey, data);
      toast.success(ENROLLMENT.success[action]);
    },
    onError: () => toast.error(ENROLLMENT.error[action]),
  });

  const regenerateQr = useMutation({
    mutationFn: (input: ProvisioningInput) => fetchEnrollmentQrApi(input),
    ...afterMutation("regenerateQr", ENROLLMENTS.qrCode),
  });

  const regenerateCode = useMutation({
    mutationFn: () => fetchEnrollmentCodeApi({ isNew: true }),
    ...afterMutation("regenerateCode", ENROLLMENTS.code),
  });

  const applyDeviceOwner = useMutation({
    mutationFn: applyDeviceOwnerApi,
    ...afterMutation("applyDeviceOwner"),
  });

  return { regenerateQr, regenerateCode, applyDeviceOwner };
};
