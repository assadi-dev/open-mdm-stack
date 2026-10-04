import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ENROLLMENT } from "@/constants/enrollment";
import { applyDeviceOwnerApi, createEnrollmentQrApi, generateEnrollmentCodeApi } from "../_services/enrollment.api";
import { ENROLLMENTS } from "../_services/enrollment.queries";

type EnrollmentAction = keyof typeof ENROLLMENT.success & keyof typeof ENROLLMENT.error;

export const useEnrollmentMutation = () => {
  const queryClient = useQueryClient();

  // Le code généré est écrit dans le cache, d'où la carte le lit (`useEnrollmentCode`) : un nouveau remplace l'ancien.
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

  // Le premier code comme les suivants : rien n'est généré à l'ouverture de la carte.
  const generateCode = useMutation({
    mutationFn: generateEnrollmentCodeApi,
    ...afterMutation("generateCode", ENROLLMENTS.code),
  });

  const applyDeviceOwner = useMutation({
    mutationFn: applyDeviceOwnerApi,
    ...afterMutation("applyDeviceOwner"),
  });

  return { generateQr, generateCode, applyDeviceOwner };
};
