import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DEVICE } from "@/constants/device";
import { removeDevicesApi, updateDeviceApi } from "../_services/devices.api";
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
  });

  // Un seul appareil et plusieurs font le même appel : un seul appareil envoie une liste d'un id. Seuls les messages diffèrent.
  const remove = useMutation({
    mutationFn: (id: string) => removeDevicesApi([id]),
    ...afterMutation("delete", [DEVICES.collection]),
  });
  const removeMany = useMutation({
    mutationFn: removeDevicesApi,
    ...afterMutation("deleteMany", [DEVICES.collection]),
  });

  return { update, remove, removeMany };
};
