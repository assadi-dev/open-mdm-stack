import { z } from "zod";

// `PATCH /api/v1/device/[id]` : le nom, et rien d'autre ; `null` l'efface. La longueur reste validée par l'API.
// L'Android ID, la version d'Android et la version du SDK ne sont pas modifiables depuis le dashboard (l'API, elle, les
// accepte) : l'appareil les remonte lui-même et écraserait la saisie. `validateBody` retire ces clés, et un corps qui ne
// contient qu'elles est refusé (400).
export const updateDeviceBodySchema = z
    .object({
        name: z.string().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

// `DELETE /api/v1/devices` : un appareil ou plusieurs, toujours une liste d'ids (un seul appareil = une liste d'un id).
export const deleteDevicesBodySchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
});

// L'id de l'URL est recopié dans le chemin de l'API : on vérifie sa forme avant.
export const deviceIdSchema = z.uuid();
