import z from "zod";

export const createEnrollmentTokenSchema = z.object({
    expiresInMinutes: z.coerce.number().int().min(1).optional(),
    wifiSsid: z.string().optional(),
    wifiPassword: z.string().optional(),
    // Friendly value; mapped to the Android-accepted token (WPA2/WPA3 -> "WPA")
    // in the provisioning payload. Defaults to WPA2 when a Wi-Fi SSID is set.
    wifiSecurityType: z
        .enum(["NONE", "WEP", "WPA", "WPA2", "WPA3", "EAP"])
        .optional()
        .default("WPA2"),
    // Only needed for non-broadcast (hidden) SSIDs.
    wifiHidden: z.boolean().optional(),
});

const deviceInfoSchema = z.object({
    model: z.string(),
    manufacturer: z.string(),
    osVersion: z.string(),
    serial: z.string(),
});

export const enrollDeviceSchema = z.object({
    enrollmentToken: z.string().min(1),
    device: deviceInfoSchema,
});

export const heartbeatSchema = z.object({
    battery: z.number().int(),
    storageFreeBytes: z.number().int().nonnegative(),
    online: z.boolean(),
    ts: z.number().int(),
});

const storageSchema = z.object({
    totalBytes: z.number().int().nonnegative(),
    freeBytes: z.number().int().nonnegative(),
});

const installedAppSchema = z.object({
    packageName: z.string(),
    versionName: z.string(),
    system: z.boolean(),
});

export const inventorySchema = z.object({
    os: z.string(),
    model: z.string(),
    manufacturer: z.string(),
    serial: z.string(),
    storage: storageSchema,
    apps: z.array(installedAppSchema),
});

export type CreateEnrollmentTokenInput = z.infer<typeof createEnrollmentTokenSchema>;
export type EnrollDeviceInput = z.infer<typeof enrollDeviceSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;

export const deviceDecoder = {
    createToken: (data: unknown) => createEnrollmentTokenSchema.safeParse(data),
    enroll: (data: unknown) => enrollDeviceSchema.safeParse(data),
    heartbeat: (data: unknown) => heartbeatSchema.safeParse(data),
    inventory: (data: unknown) => inventorySchema.safeParse(data),
};
