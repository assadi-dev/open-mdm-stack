import { z } from "zod";

// `PATCH /api/v1/device/[id]` : tout est facultatif, mais au moins un champ ; `null` efface la valeur.
// Les longueurs et les formats restent validés par l'API. L'Android ID n'est pas modifiable depuis le dashboard (l'API,
// elle, l'accepte) : `validateBody` retire la clé, et un corps qui ne contient que lui est refusé (400).
export const updateDeviceBodySchema = z
    .object({
        name: z.string().nullable().optional(),
        androidVersion: z.string().nullable().optional(),
        sdkVersion: z.number().int().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// `DELETE /api/v1/devices` : un appareil ou plusieurs, toujours une liste d'ids (un seul appareil = une liste d'un id).
export const deleteDevicesBodySchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
});

// L'id de l'URL est recopié dans le chemin de l'API : on vérifie sa forme avant.
export const deviceIdSchema = z.uuid();
