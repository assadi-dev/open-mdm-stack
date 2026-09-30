import { useQuery } from "@tanstack/react-query";
import { fetchWifiNetworkCollectionApi } from "../_services/wifi-networks.api";
import { WIFI_NETWORKS } from "../_services/wifi-networks.queries";

export const useFetchWifiNetworkCollection = () =>
  useQuery({ queryKey: WIFI_NETWORKS.collection, queryFn: fetchWifiNetworkCollectionApi });
