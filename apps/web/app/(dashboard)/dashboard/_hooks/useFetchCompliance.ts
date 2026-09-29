import { useQuery } from "@tanstack/react-query";
import { fetchComplianceApi } from "../_services/dashboard.api";
import { DASHBOARD_QUERIES } from "../_services/dashboard.queries";

export const useFetchCompliance = () => useQuery({ queryKey: DASHBOARD_QUERIES.compliance, queryFn: fetchComplianceApi });
