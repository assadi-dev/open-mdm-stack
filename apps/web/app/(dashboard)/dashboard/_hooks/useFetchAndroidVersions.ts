import { useQuery } from "@tanstack/react-query";
import { fetchAndroidVersionsApi } from "../_services/dashboard.api";
import { DASHBOARD_QUERIES } from "../_services/dashboard.queries";

export const useFetchAndroidVersions = () => useQuery({ queryKey: DASHBOARD_QUERIES.androidVersions, queryFn: fetchAndroidVersionsApi });
