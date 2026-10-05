import { z } from "zod";

// Les indicateurs que l'API sait calculer aujourd'hui, tous issus de `GET /devices/summary`. Il n'y a pas encore de
// « non conformes » (aucune politique n'est évaluée) ni de décompte des commandes.
export const KPI_IDS = ["enrolled", "online", "offline", "commandRunning"] as const;
export const DEVICE_STATUS_KEYS = ["compliant", "offline", "nonCompliant", "commandRunning"] as const;

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

// Ce que `GET /devices/summary` renvoie pour le parc entier, réduit à ce que le tableau de bord en lit.
export const deviceSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.object({
    pending: z.number().int().nonnegative(),
    offline: z.number().int().nonnegative(),
    commandRunning: z.number().int().nonnegative(),
    online: z.number().int().nonnegative(),
  }),
});

export const kpiSchema = z.object({
  id: z.enum(KPI_IDS),
  value: z.number().int().nonnegative(),
  // Les variations (« +3,2 % cette semaine ») ne sont pas fournies par l'API pour l'instant : à rétablir avec le hint
  // et le DeltaBadge de la carte (`StatCard`).
  // delta: z.number(),
  // deltaUnit: z.enum(["count", "percent"]),
});

export const kpisSchema = z.object({
  attentionDeviceCount: z.number().int().nonnegative(),
  items: z.array(kpiSchema),
});

export const commandsFlowSchema = z.object({
  months: z.array(z.object({ month: monthSchema, count: z.number().nonnegative() })).min(1),
  highlightMonth: monthSchema.optional(),
});

export const complianceSchema = z.object({
  compliantCount: z.number().int().nonnegative(),
  totalCount: z.number().int().positive(),
});

export const androidVersionsSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  versions: z.array(z.object({ label: z.string(), count: z.number().nonnegative(), other: z.boolean().optional() })),
});

export const recentDeviceSchema = z.object({
  id: z.string(),
  model: z.string(),
  serial: z.string(),
  user: z.string(),
  group: z.string(),
  status: z.enum(DEVICE_STATUS_KEYS),
  battery: z.number().min(0).max(100).nullable(),
  lastSeenAt: z.iso.datetime(),
});

export const DashboardDto = {
  parseDeviceSummary: (data: unknown) => deviceSummarySchema.parse(data),
  parseCommandsFlow: (data: unknown) => commandsFlowSchema.parse(data),
  parseCompliance: (data: unknown) => complianceSchema.parse(data),
  parseAndroidVersions: (data: unknown) => androidVersionsSchema.parse(data),
  parseRecentDevices: (data: unknown) => z.array(recentDeviceSchema).parse(data),
};
