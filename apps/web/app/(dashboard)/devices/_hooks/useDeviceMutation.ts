import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DEVICE } from "@/constants/device";
import {
  blockDeviceApi,
  blockDevicesApi,
  refreshDeviceApi,
  refreshDevicesApi,
  removeDevicesApi,
  updateDeviceApi,
} from "../_services/devices.api";
import { DEVICES } from "../_services/devices.queries";
import { toRefreshErrorMessage, toRefreshManyLoading, toRefreshManySuccess } from "../_services/devices.utils";

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

  // Le blocage change la ligne (statut « Bloqué ») et ce que le filtre « Appareils bloqués » retient.
  const block = useMutation({
    mutationFn: blockDeviceApi,
    ...afterMutation("block", [DEVICES.collection]),
  });
  const blockMany = useMutation({
    mutationFn: blockDevicesApi,
    ...afterMutation("blockMany", [DEVICES.collection]),
  });

  // L'actualisation attend l'appareil (15 s au plus) : un toast de promesse la suit de l'envoi au résultat, puis la liste
  // se recharge (batterie, dernier contact). L'échec a un message par cause : hors ligne, sans réponse, ou générique.
  const refresh = useMutation({
    mutationFn: (id: string) => {
      const request = refreshDeviceApi(id);
      toast.promise(request, {
        loading: DEVICE.toast.refresh.loading,
        success: DEVICE.success.refresh,
        error: toRefreshErrorMessage,
      });
      return request;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DEVICES.collection }),
  });

  // Plusieurs appareils : même toast de promesse, un seul pour toute la sélection (envoi, puis résultat de chacun). L'API
  // répond 200 même si des appareils sont injoignables : c'est le texte du toast qui dit combien ont répondu.
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

  return { update, refresh, refreshMany, remove, removeMany, block, blockMany };
};
