const ROOT = ["enrollment"] as const;

export const ENROLLMENTS = {
  options: [...ROOT, "options"] as const,
  // Le QR code et le code affichés : une régénération remplace leur donnée en cache, elle ne crée pas de clé.
  qrCode: [...ROOT, "qr-code"] as const,
  code: [...ROOT, "code"] as const,
} as const;
