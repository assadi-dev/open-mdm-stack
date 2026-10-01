import { useQuery } from "@tanstack/react-query";
import { fetchRecentDevicesApi } from "../_services/dashboard.api";
import { DASHBOARD_QUERIES } from "../_services/dashboard.queries";

export const useFetchRecentDevices = () => useQuery({ queryKey: DASHBOARD_QUERIES.recentDevices, queryFn: fetchRecentDevicesApi });
