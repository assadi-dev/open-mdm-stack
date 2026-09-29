import { z } from "zod";

export const KPI_IDS = ["enrolled", "online", "nonCompliant", "pendingCommands"] as const;
export const DEVICE_STATUS_KEYS = ["compliant", "offline", "nonCompliant", "commandRunning"] as const;

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const kpiSchema = z.object({
  id: z.enum(KPI_IDS),
  value: z.number(),
  delta: z.number(),
  deltaUnit: z.enum(["count", "percent"]),
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
  parseKpis: (data: unknown) => kpisSchema.parse(data),
  parseCommandsFlow: (data: unknown) => commandsFlowSchema.parse(data),
  parseCompliance: (data: unknown) => complianceSchema.parse(data),
  parseAndroidVersions: (data: unknown) => androidVersionsSchema.parse(data),
  parseRecentDevices: (data: unknown) => z.array(recentDeviceSchema).parse(data),
};
