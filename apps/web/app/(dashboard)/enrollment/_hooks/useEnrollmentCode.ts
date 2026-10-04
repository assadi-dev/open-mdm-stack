import { skipToken, useQuery } from "@tanstack/react-query";
import type { EnrollmentCode } from "../_types/enrollment.types";
import { ENROLLMENTS } from "../_services/enrollment.queries";

// Le code affiché, lu dans le cache sans jamais être chargé : chaque appel à l'API en génère un nouveau, il n'existe
// donc qu'une fois généré à la demande (`useEnrollmentMutation.generateCode`, qui l'écrit ici). Gardé tant que la page
// est ouverte, même si la carte est démontée (retour à la connexion USB).
export const useEnrollmentCode = () => {
  const { data } = useQuery<EnrollmentCode>({
    queryKey: ENROLLMENTS.code,
    queryFn: skipToken,
    gcTime: Infinity,
  });
  return data;
};
