import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DEVICE } from "@/constants/device";
import { refreshDeviceApi, refreshDevicesApi, removeDevicesApi, updateDeviceApi } from "../_services/devices.api";
import { DEVICES } from "../_services/devices.queries";
import { toRefreshErrorMessage, toRefreshManyLoading, toRefreshManySuccess } from "../_services/devices.utils";

export const useDeviceMutation = () => {
  const queryClient = useQueryClient();

  // `toErrorMessage` : l'échec d'une action peut avoir plusieurs messages (voir `toRefreshErrorMessage`) ; par défaut, un seul.
  const afterMutation = (
    action: keyof typeof DEVICE.success,
    queryKeys: QueryKey[],
    toErrorMessage: (error: unknown) => string = () => DEVICE.error[action],
  ) => ({
    onSuccess: () => {
      queryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success(DEVICE.success[action]);
    },
    onError: (error: unknown) => toast.error(toErrorMessage(error)),
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

  // L'actualisation attend l'appareil (15 s au plus) : elle recharge la liste, qui porte la batterie et le dernier contact.
  const refresh = useMutation({
    mutationFn: refreshDeviceApi,
    ...afterMutation("refresh", [DEVICES.collection], toRefreshErrorMessage),
  });

  // Plusieurs appareils : un seul toast de promesse suit toute la sélection (envoi, puis résultat de chacun). L'API répond
  // 200 même si des appareils sont injoignables : c'est le texte du toast qui dit combien ont répondu.
  const refreshMany = useMutation({
    mutationFn: (ids: string[]) => {
      const request = refreshDevicesApi(ids);
      toast.promise(request, {
        loading: toRefreshManyLoading(ids.length),
        success: toRefreshManySuccess,
        error: DEVICE.error.refreshMany,
      });
      return request;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEVICES.collection }),
  });

  return { update, refresh, refreshMany, remove, removeMany };
};
