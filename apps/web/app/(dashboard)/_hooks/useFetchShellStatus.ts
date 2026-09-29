import { useQuery } from "@tanstack/react-query";
import { fetchShellStatusApi } from "../_services/shell.api";
import { SHELL } from "../_services/shell.queries";

export const useFetchShellStatus = () => useQuery({ queryKey: SHELL.status, queryFn: fetchShellStatusApi });
