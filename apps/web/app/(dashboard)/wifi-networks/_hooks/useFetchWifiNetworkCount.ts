import { useQuery } from "@tanstack/react-query";
import { fetchWifiNetworkCountApi } from "../_services/wifi-networks.api";
import { WIFI_NETWORKS } from "../_services/wifi-networks.queries";

export const useFetchWifiNetworkCount = () =>
  useQuery({ queryKey: WIFI_NETWORKS.count, queryFn: fetchWifiNetworkCountApi });
