import { z } from "zod";
import { toPaginatedSchema } from "@/lib/api/dto/pagination.dto";

// Les statuts que `device_overview` produit. Pas de « conforme » ni « non conforme » : aucune politique n'est évaluée.
export const DEVICE_STATUS_KEYS = ["pending", "offline", "commandRunning", "online"] as const;

// Ce que `GET /devices` renvoie pour chaque appareil. Le modèle, le n° de série, la version d'Android et le porteur sont
// facultatifs côté API ; la batterie est `null` tant qu'elle n'a jamais été remontée, les deux dates quand l'appareil n'a jamais été vu.
export const deviceSchema = z.object({
  id: z.string(),
  serial: z.string().nullable(),
  model: z.string().nullable(),
  brand: z.string().nullable(),
  androidVersion: z.string().nullable(),
  sdkVersion: z.number().int().nullable(),
  assignedToUserId: z.string().nullable(),
  assignedToName: z.string().nullable(),
  status: z.enum(DEVICE_STATUS_KEYS),
  battery: z.number().min(0).max(100).nullable(),
  lastHeartbeatAt: z.iso.datetime().nullable(),
  presenceChangedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

const deviceCollectionSchema = toPaginatedSchema(deviceSchema);

// Ce que `GET /devices/summary` renvoie : le parc entier, que la recherche et les filtres du tableau ne réduisent pas.
export const deviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.record(z.enum(DEVICE_STATUS_KEYS), z.number().int().nonnegative()),
  // Les versions d'Android présentes dans le parc, les plus récentes d'abord.
  androidVersions: z.array(
    z.object({
      sdkVersion: z.number().int(),
      androidVersion: z.string().nullable(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const DeviceDto = {
  parseCollection: (data: unknown) => deviceCollectionSchema.parse(data),
  parseSummary: (data: unknown) => deviceSummarySchema.parse(data),
};
