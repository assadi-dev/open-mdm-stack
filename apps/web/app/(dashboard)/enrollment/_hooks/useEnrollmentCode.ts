import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { EnrollmentCode } from "../_types/enrollment.types";
import { ENROLLMENTS } from "../_services/enrollment.queries";
import { useEnrollmentMutation } from "./useEnrollmentMutation";

// Le code affiché, lu dans le cache sans jamais être chargé : chaque appel à l'API en génère un nouveau, il n'existe
// donc qu'une fois généré à la demande (`generate`, dont la mutation l'écrit ici). Pendant une régénération, l'ancien
// reste affiché jusqu'à l'arrivée du nouveau.
// Effacé quand la carte est quittée (retour à l'USB, autre onglet, autre page) : on revient sur l'état vide, et le
// compte à rebours repart du prochain code généré. Une génération encore en cours est annulée au même moment : sa
// réponse ne peut plus réécrire un code dans le cache une fois la carte quittée.
export const useEnrollmentCode = () => {
  const queryClient = useQueryClient();
  const { generateCode } = useEnrollmentMutation();
  const controllerRef = useRef<AbortController | null>(null);
  const { data } = useQuery<EnrollmentCode>({
    queryKey: ENROLLMENTS.code,
    queryFn: skipToken,
  });

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      queryClient.removeQueries({ queryKey: ENROLLMENTS.code, exact: true });
    },
    [queryClient],
  );

  const generate = () => {
    controllerRef.current = new AbortController();
    generateCode.mutate(controllerRef.current.signal);
  };

  return { enrollmentCode: data, generate, isGenerating: generateCode.isPending };
};
