import { enrollmentMethod, enrollmentStatus } from "@drizzle/schemas/device-schema";
import z from "zod";



const deviceInfoSchema = z.object({
    androidId: z.string().optional(),
    brand: z.string().optional(),
    model: z.string(),
    manufacturer: z.string(),
    release: z.string(),
    sdkVersion: z.number().int(),
    serial: z.string().optional(),
    imei: z.string().optional(),
    macAddress: z.string().optional(),
    ipAddress: z.string().optional(),
    enrollmentStatus: z.enum(enrollmentStatus).optional(),
    enrollmentMethod: z.enum(enrollmentMethod).optional(),
    // SPKI/DER-encoded public key, base64 — required so the server can verify
    // the proof-of-possession signature (see enrollDeviceSchema.signature).
    publicKey: z.string().min(1, "publicKey is required"),
    agentVersionName: z.string().optional(),
    agentVersionCode: z.number().optional(),
    agentPackage: z.string().optional(),
});

export const enrollDeviceSchema = z.object({
    // Single-use anti-replay nonce fetched from GET /devices/enroll/challenge,
    // included in the signed canonical message below. The sole enrollment
    // authorization — there's no separate admin-issued token.
    challenge: z.string().min(1, "challenge is required"),
    // Must match the `timestamp` field used to build the signed canonical
    // message — opaque to the server beyond that (see canonical-message.ts).
    timestamp: z.string().min(1, "timestamp is required"),
    // Proof of possession: signature over the canonical message (device
    // identity + method + timestamp + publicKey + challenge), produced by
    // the private key matching `device.publicKey`. Verified before the
    // challenge is consumed (see DeviceService.create).
    signature: z.string().min(1, "signature is required"),
    device: deviceInfoSchema,
});

export const heartbeatSchema = z.object({
    battery: z.number().int(),
    storageFreeBytes: z.number().int().nonnegative(),
    online: z.boolean(),
    ts: z.number().int(),
    // Screen power state (on/off) — a periodic re-assertion alongside the
    // real-time report on mdm/devices/{id}/screen (see ScreenStateReporter.kt).
    screenOn: z.boolean(),
    sdkVersion: z.number().int().optional(),
    ipAddress: z.string().optional(),
    agentVersionName: z.string().optional(),
    agentVersionCode: z.number().optional(),
    agentPackage: z.string().optional(),
});

const storageSchema = z.object({
    totalBytes: z.number().int().nonnegative(),
    freeBytes: z.number().int().nonnegative(),
    usedBytes: z.number().int().nonnegative(),
});

const memorySchema = z.object({
    totalBytes: z.number().int().nonnegative(),
    usedBytes: z.number().int().nonnegative(),
});

const networkSchema = z.object({
    type: z.string(),
    name: z.string().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    macAddress: z.string().nullable().optional(),
});

const batterySchema = z.object({
    level: z.number().int(),
    charging: z.boolean(),
    health: z.string(),
});

const locationSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().nullable().optional(),
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
    network: networkSchema,
    memory: memorySchema,
    battery: batterySchema,
    locations: locationSchema,
});

// Device -> API on PATCH /devices/:deviceId/telemetry. Unlike POST
// /inventory (a full snapshot, all groups required), this is a targeted
// update: any subset of groups, merged into what's already stored rather
// than replacing it (see DeviceRepository.patchTelemetry).
export const telemetryPatchSchema = z.object({
    network: networkSchema.partial().optional(),
    memory: memorySchema.partial().optional(),
    storage: storageSchema.partial().optional(),
    battery: batterySchema.partial().optional(),
    location: locationSchema.partial().optional(),
}).refine(
    (data) => data.network || data.memory || data.storage || data.battery || data.location,
    { message: "At least one of network, memory, storage, battery, location is required" },
);

export type EnrollDeviceInput = z.infer<typeof enrollDeviceSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type TelemetryPatchInput = z.infer<typeof telemetryPatchSchema>;


export const deviceDecoder = {
    enroll: (data: unknown) => enrollDeviceSchema.safeParse(data),
    heartbeat: (data: unknown) => heartbeatSchema.safeParse(data),
    inventory: (data: unknown) => inventorySchema.safeParse(data),
    telemetryPatch: (data: unknown) => telemetryPatchSchema.safeParse(data),
};
