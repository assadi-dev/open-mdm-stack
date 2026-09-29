import { useQuery } from "@tanstack/react-query";
import { fetchDashboardKpisApi } from "../_services/dashboard.api";
import { DASHBOARD_QUERIES } from "../_services/dashboard.queries";

export const useFetchDashboardKpis = () => useQuery({ queryKey: DASHBOARD_QUERIES.kpis, queryFn: fetchDashboardKpisApi });
