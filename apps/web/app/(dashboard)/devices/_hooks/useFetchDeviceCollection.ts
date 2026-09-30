import { useQuery } from "@tanstack/react-query";
import { fetchDeviceCollectionApi } from "../_services/devices.api";
import { DEVICES } from "../_services/devices.queries";

export const useFetchDeviceCollection = () => useQuery({ queryKey: DEVICES.collection, queryFn: fetchDeviceCollectionApi });
