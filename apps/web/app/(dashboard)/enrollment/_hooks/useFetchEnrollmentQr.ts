import { useQuery } from "@tanstack/react-query";
import { fetchEnrollmentQrApi } from "../_services/enrollment.api";
import { ENROLLMENTS } from "../_services/enrollment.queries";

// Chaque appel génère un nouveau QR code : jamais de rechargement automatique (retour sur l'onglet, reconnexion).
// Seul « Régénérer le QR code » le remplace.
export const useFetchEnrollmentQr = () =>
  useQuery({
    queryKey: ENROLLMENTS.qrCode,
    queryFn: () => fetchEnrollmentQrApi(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
