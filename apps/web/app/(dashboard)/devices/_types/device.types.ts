import type { z } from "zod";
import type { DEVICE } from "@/constants/device";
import type { deviceSchema } from "../_dto/device.dto";

export type Device = z.infer<typeof deviceSchema>;
export type DeviceTab = keyof typeof DEVICE.tabs;
export type DeviceTabCounts = Record<DeviceTab, number>;

export type FilterOption = {
  value: string;
  label: string;
};

export type DeviceFilters = {
  tab: DeviceTab;
  group: string;
  androidVersion: string;
};
