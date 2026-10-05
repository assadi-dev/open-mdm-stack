const ROOT = ["enrollment"] as const;

// Le QR code n'a pas de clé : il n'est jamais lu, seulement généré à la demande (`useEnrollmentMutation.generateQr`).
export const ENROLLMENTS = {
  options: [...ROOT, "options"] as const,
  // Le code affiché, jamais chargé : seule sa génération l'écrit (`useEnrollmentMutation.generateCode`).
  code: [...ROOT, "code"] as const,
} as const;
