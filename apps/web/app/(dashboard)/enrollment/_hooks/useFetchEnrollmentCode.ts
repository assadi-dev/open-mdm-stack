import { useQuery } from "@tanstack/react-query";
import { fetchEnrollmentCodeApi } from "../_services/enrollment.api";
import { ENROLLMENTS } from "../_services/enrollment.queries";

// Chaque appel génère un nouveau code : jamais de rechargement automatique, le code recopié sur l'appareil resterait périmé.
// Seul « Générer un nouveau code » le remplace.
export const useFetchEnrollmentCode = () =>
  useQuery({
    queryKey: ENROLLMENTS.code,
    queryFn: () => fetchEnrollmentCodeApi(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
