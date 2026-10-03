import type { z } from "zod";
import type { DEVICE } from "@/constants/device";
import type { deviceFormSchema, deviceSchema, deviceSummarySchema } from "../_dto/device.dto";

export type Device = z.infer<typeof deviceSchema>;
export type DeviceStatus = Device["status"];
export type DeviceSummary = z.infer<typeof deviceSummarySchema>;
export type DeviceTab = keyof typeof DEVICE.tabs;
export type DeviceTabCounts = Record<DeviceTab, number>;
export type DeviceFormValues = z.infer<typeof deviceFormSchema>;

// Ce que l'API reçoit : `null` efface la valeur.
export type UpdateDeviceInput = {
  id: string;
  name: string | null;
};

export type FilterOption = {
  value: string;
  label: string;
};
