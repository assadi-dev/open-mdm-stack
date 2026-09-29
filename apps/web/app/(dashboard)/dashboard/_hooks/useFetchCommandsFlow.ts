import { useQuery } from "@tanstack/react-query";
import { fetchCommandsFlowApi } from "../_services/dashboard.api";
import { DASHBOARD_QUERIES } from "../_services/dashboard.queries";

export const useFetchCommandsFlow = () => useQuery({ queryKey: DASHBOARD_QUERIES.commandsFlow, queryFn: fetchCommandsFlowApi });
