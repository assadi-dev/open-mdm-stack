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

// `PATCH /api/v1/wifi-network/[id]` : tout est facultatif, mais au moins un champ ; `name: null` efface le nom.
export const updateWifiNetworkBodySchema = z
    .object({
        name: z.string().min(1).nullable().optional(),
        ssid: z.string().min(1).optional(),
        security: z.enum(WIFI_SECURITY_KEYS).optional(),
        password: z.string().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// `DELETE /api/v1/wifi-networks` : un réseau ou plusieurs, toujours une liste d'ids (un seul réseau = une liste d'un id).
export const deleteWifiNetworksBodySchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
});

// L'id de l'URL est recopié dans le chemin de l'API : on vérifie sa forme avant.
export const wifiNetworkIdSchema = z.uuid();
