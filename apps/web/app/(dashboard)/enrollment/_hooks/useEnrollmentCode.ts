import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { EnrollmentCode } from "../_types/enrollment.types";
import { ENROLLMENTS } from "../_services/enrollment.queries";

// Le code affiché, lu dans le cache sans jamais être chargé : chaque appel à l'API en génère un nouveau, il n'existe
// donc qu'une fois généré à la demande (`useEnrollmentMutation.generateCode`, qui l'écrit ici). Pendant une
// régénération, l'ancien reste affiché jusqu'à l'arrivée du nouveau.
// Effacé quand la carte est quittée (retour à l'USB, autre onglet, autre page) : on revient sur l'état vide, et le
// compte à rebours repart du prochain code généré.
export const useEnrollmentCode = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery<EnrollmentCode>({
    queryKey: ENROLLMENTS.code,
    queryFn: skipToken,
  });

  useEffect(() => () => queryClient.removeQueries({ queryKey: ENROLLMENTS.code, exact: true }), [queryClient]);

  return data;
};
