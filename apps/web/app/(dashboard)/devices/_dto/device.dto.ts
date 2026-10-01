import { z } from "zod";

export const DEVICE_STATUS_KEYS = ["compliant", "offline", "nonCompliant", "commandRunning", "pending"] as const;

export const deviceSchema = z.object({
  id: z.string(),
  model: z.string(),
  serial: z.string(),
  user: z.string(),
  group: z.string(),
  policy: z.string(),
  androidVersion: z.number().int().positive(),
  status: z.enum(DEVICE_STATUS_KEYS),
  battery: z.number().min(0).max(100).nullable(),
  lastSeenAt: z.iso.datetime(),
});

export const DeviceDto = {
  parseCollection: (data: unknown) => z.array(deviceSchema).parse(data),
};
