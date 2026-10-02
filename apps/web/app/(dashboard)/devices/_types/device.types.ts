import type { z } from "zod";
import type { DEVICE } from "@/constants/device";
import type { deviceSchema, deviceSummarySchema } from "../_dto/device.dto";

export type Device = z.infer<typeof deviceSchema>;
export type DeviceStatus = Device["status"];
export type DeviceSummary = z.infer<typeof deviceSummarySchema>;
export type DeviceTab = keyof typeof DEVICE.tabs;
export type DeviceTabCounts = Record<DeviceTab, number>;

export type FilterOption = {
  value: string;
  label: string;
};
