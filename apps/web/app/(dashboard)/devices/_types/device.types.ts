import type { z } from "zod";
import type { DEVICE } from "@/constants/device";
import type { deviceFormSchema, deviceRefreshSchema, deviceSchema, deviceSummarySchema } from "../_dto/device.dto";

export type Device = z.infer<typeof deviceSchema>;
export type DeviceStatus = Device["status"];
export type DeviceSummary = z.infer<typeof deviceSummarySchema>;
export type DeviceTab = keyof typeof DEVICE.tabs;
export type DeviceTabCounts = Record<DeviceTab, number>;
export type DeviceFormValues = z.infer<typeof deviceFormSchema>;
export type DeviceRefreshResult = z.infer<typeof deviceRefreshSchema>["results"][number];

// Les filtres du panneau « Filtrer », tels que les champs les manipulent : des listes de textes (l'API compare des
// nombres pour la version, la conversion se fait dans `useDeviceFilters`).
export type DeviceFilterValues = {
  brand: string[];
  model: string[];
  sdkVersion: string[];
};

// Ce que l'API reçoit : `null` efface la valeur.
export type UpdateDeviceInput = {
  id: string;
  name: string | null;
};
