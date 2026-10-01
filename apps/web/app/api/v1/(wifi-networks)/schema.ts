import { z } from "zod";
import { WIFI_SECURITY_KEYS } from "@/app/(dashboard)/wifi-networks/_dto/wifi-network.dto";

// Ce que le proxy accepte pour `POST /api/v1/wifi-network` : les champs obligatoires de l'API (`createWifiNetworkSchema`).
// Les types de sécurité sont ceux que le dashboard sait afficher (sans `EAP`). Longueurs et formats restent validés par l'API.
export const createWifiNetworkBodySchema = z
    .object({
        name: z.string().min(1).optional(),
        ssid: z.string().min(1),
        security: z.enum(WIFI_SECURITY_KEYS),
        password: z.string().min(1).optional(),
    })
    // Un réseau ouvert n'a pas de mot de passe ; tous les autres en exigent un.
    .refine(({ security, password }) => security === "NONE" || password !== undefined, {
        path: ["password"],
        message: "Required",
    });
