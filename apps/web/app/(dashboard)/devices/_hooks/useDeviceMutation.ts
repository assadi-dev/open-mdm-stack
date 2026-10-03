import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DEVICE } from "@/constants/device";
import { Conflict } from "@/lib/api/intefaces/http-errors";
import { updateDeviceApi } from "../_services/devices.api";
import { DEVICES } from "../_services/devices.queries";

export const useDeviceMutation = () => {
  const queryClient = useQueryClient();

  const afterMutation = (action: keyof typeof DEVICE.success, queryKeys: QueryKey[]) => ({
    onSuccess: () => {
      queryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success(DEVICE.success[action]);
    },
    onError: () => toast.error(DEVICE.error[action]),
  });

  // `DEVICES.collection` est le préfixe du tableau et du résumé : la version d'Android modifiée change les deux.
  const update = useMutation({
    mutationFn: updateDeviceApi,
    ...afterMutation("update", [DEVICES.collection]),
    // Un Android ID déjà porté par un autre appareil : l'administrateur peut y remédier, le toast le dit.
    onError: (error) => toast.error(error instanceof Conflict ? DEVICE.error.updateConflict : DEVICE.error.update),
  });

  return { update };
};
