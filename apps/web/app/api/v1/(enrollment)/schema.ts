import { z } from "zod";

// `POST /api/v1/enrollment/qr-code` : les réglages inscrits dans le QR code, tous facultatifs (l'API applique ses valeurs
// par défaut). Le nom de l'appareil est celui du formulaire, `{n}` compris. Les longueurs et les formats restent validés
// par l'API ; l'id du réseau Wi-Fi est un `uuid` : un autre texte ferait échouer la requête en base (500) au lieu de 400.
export const createEnrollmentQrBodySchema = z.object({
    name: z.string().min(1).optional(),
    groupId: z.string().min(1).optional(),
    policyId: z.string().min(1).optional(),
    wifiId: z.uuid().optional(),
    apkUrl: z.string().min(1).optional(),
});
