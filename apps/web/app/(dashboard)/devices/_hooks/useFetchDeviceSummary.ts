import { useQuery } from "@tanstack/react-query";
import { fetchDeviceSummaryApi } from "../_services/devices.api";
import { DEVICES } from "../_services/devices.queries";

export const useFetchDeviceSummary = () => useQuery({ queryKey: DEVICES.summary, queryFn: fetchDeviceSummaryApi });
