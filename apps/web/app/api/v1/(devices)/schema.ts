import { z } from "zod";

// `PATCH /api/v1/device/[id]` : tout est facultatif, mais au moins un champ ; `null` efface la valeur.
// Les longueurs et les formats restent validés par l'API.
export const updateDeviceBodySchema = z
    .object({
        name: z.string().nullable().optional(),
        androidVersion: z.string().nullable().optional(),
        sdkVersion: z.number().int().nullable().optional(),
        androidId: z.string().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// L'id de l'URL est recopié dans le chemin de l'API : on vérifie sa forme avant.
export const deviceIdSchema = z.uuid();
