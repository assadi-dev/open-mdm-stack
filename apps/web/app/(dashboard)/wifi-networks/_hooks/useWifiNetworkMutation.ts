import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { createWifiNetworkApi, removeWifiNetworkApi, updateWifiNetworkApi } from "../_services/wifi-networks.api";
import { WIFI_NETWORKS } from "../_services/wifi-networks.queries";

export const useWifiNetworkMutation = () => {
  const queryClient = useQueryClient();

  const afterMutation = (action: keyof typeof WIFI_NETWORK.success, queryKeys: QueryKey[]) => ({
    onSuccess: () => {
      queryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success(WIFI_NETWORK.success[action]);
    },
    onError: () => toast.error(WIFI_NETWORK.error[action]),
  });

  const create = useMutation({
    mutationFn: createWifiNetworkApi,
    ...afterMutation("create", [WIFI_NETWORKS.collection]),
  });
  const update = useMutation({
    mutationFn: updateWifiNetworkApi,
    ...afterMutation("update", [WIFI_NETWORKS.collection]),
  });
  const remove = useMutation({
    mutationFn: removeWifiNetworkApi,
    ...afterMutation("delete", [WIFI_NETWORKS.collection]),
  });

  return { create, update, remove };
};
