import type { z } from "zod";
import type {
  androidVersionsSchema,
  commandsFlowSchema,
  complianceSchema,
  deviceSummarySchema,
  kpiSchema,
  kpisSchema,
  recentDeviceSchema,
} from "../_dto/dashboard.dto";

export type DeviceSummary = z.infer<typeof deviceSummarySchema>;
export type Kpi = z.infer<typeof kpiSchema>;
export type DashboardKpis = z.infer<typeof kpisSchema>;
export type CommandsFlow = z.infer<typeof commandsFlowSchema>;
export type Compliance = z.infer<typeof complianceSchema>;
export type AndroidVersions = z.infer<typeof androidVersionsSchema>;
export type RecentDevice = z.infer<typeof recentDeviceSchema>;
