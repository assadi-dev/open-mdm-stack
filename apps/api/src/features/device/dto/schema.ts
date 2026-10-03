import { deviceOverviewStatus } from "@drizzle/schemas/device-overview-view";
import { enrollmentMethod, enrollmentStatus } from "@drizzle/schemas/device-schema";
import { MAX_LIMIT } from "@features/paginations/domain/paginations";
import { createCollectionQuerySchema } from "@features/paginations/dto/schema";
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

// Admin -> API on GET /devices?page=1&limit=20&search=pixel&sort=-createdAt,model&status=offline,pending&sdkVersion=34,33
// Sort and filter names are the API field names (see DeviceRepository.collection).
export const deviceCollectionQuerySchema = createCollectionQuerySchema({
    sortable: [
        "displayName",
        "model",
        "serial",
        "assignedToName",
        "sdkVersion",
        "battery",
        "lastHeartbeatAt",
        "presenceChangedAt",
        "createdAt",
    ],
    filters: {
        status: z.enum(deviceOverviewStatus),
        sdkVersion: z.coerce.number<string>().int(),
    },
});

const NAME_MAX_LENGTH = 100;
const ANDROID_VERSION_MAX_LENGTH = 32;
const ANDROID_ID_MAX_LENGTH = 64;
const SDK_VERSION_MAX = 99;

// A blank text is "no value": it clears the field, like an explicit `null`.
const clearableText = (maxLength: number) =>
    z.string().trim().max(maxLength).transform((value) => value || null).nullable();

// Admin -> API on PATCH /devices/:id. Every field is optional but at least one is required; a field left out is
// untouched, `null` (or a blank text) clears it. `androidVersion` is the `release` column.
export const updateDeviceSchema = z.object({
    name: clearableText(NAME_MAX_LENGTH).optional(),
    androidVersion: clearableText(ANDROID_VERSION_MAX_LENGTH).optional(),
    sdkVersion: z.number().int().min(1).max(SDK_VERSION_MAX).nullable().optional(),
    androidId: clearableText(ANDROID_ID_MAX_LENGTH).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one of name, androidVersion, sdkVersion, androidId is required" },
);

// A list of devices to act on. Duplicated ids are collapsed.
const deviceIdsSchema = z.object({
    ids: z.array(z.uuid()).min(1, "at least one id is required").max(MAX_LIMIT).transform((ids) => [...new Set(ids)]),
});

// Admin -> API on DELETE /devices. Unenrolling one device is a list of one id: single and bulk unenrollment share
// this endpoint.
export const deleteDevicesSchema = deviceIdsSchema;

// Admin -> API on POST /devices/refresh. The single-device refresh is POST /devices/:id/refresh, which has no body.
export const refreshDevicesSchema = deviceIdsSchema;

export type EnrollDeviceInput = z.infer<typeof enrollDeviceSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type TelemetryPatchInput = z.infer<typeof telemetryPatchSchema>;
export type DeviceCollectionQuery = z.infer<typeof deviceCollectionQuerySchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
export type DeleteDevicesInput = z.infer<typeof deleteDevicesSchema>;
export type RefreshDevicesInput = z.infer<typeof refreshDevicesSchema>;


export const deviceDecoder = {
    enroll: (data: unknown) => enrollDeviceSchema.safeParse(data),
    heartbeat: (data: unknown) => heartbeatSchema.safeParse(data),
    inventory: (data: unknown) => inventorySchema.safeParse(data),
    telemetryPatch: (data: unknown) => telemetryPatchSchema.safeParse(data),
    collection: (data: unknown) => deviceCollectionQuerySchema.safeParse(data),
    update: (data: unknown) => updateDeviceSchema.safeParse(data),
    deleteMany: (data: unknown) => deleteDevicesSchema.safeParse(data),
    refreshMany: (data: unknown) => refreshDevicesSchema.safeParse(data),
};
