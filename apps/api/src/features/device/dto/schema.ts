import { enrollementMethod, enrollementStatus } from "@drizzle/schemas/device-schema";
import z from "zod";



const deviceInfoSchema = z.object({
    androidId: z.string().optional(),
    model: z.string(),
    manufacturer: z.string(),
    osVersion: z.string(),
    serial: z.string().optional(),
    imei: z.string().optional(),
    macAddress: z.string().optional(),
    ipAddress: z.string().optional(),
    enrollmentStatus: z.enum(enrollementStatus).optional(),
    enrollementMethod: z.enum(enrollementMethod).optional(),
    // SPKI/DER-encoded public key, base64 — required so the server can verify
    // the proof-of-possession signature (see enrollDeviceSchema.signature).
    publicKey: z.string().min(1, "publicKey is required"),
    agentVersionName: z.string().optional(),
    agentVersionCode: z.number().optional(),
    agentPackage: z.string().optional(),
    // Not known by the client at initial enrollment — the server assigns it
    // from the consumed token's id (see DeviceService.create). Only present
    // here for other consumers of this shape (inventory/agent updates) once
    // the device already exists.
    enrollementId: z.string().optional(),


});

export const enrollDeviceSchema = z.object({
    enrollmentToken: z.string().min(1),
    // Proof of possession: signature over `enrollmentToken`, produced by the
    // private key matching `device.publicKey`. Verified before the token is
    // consumed (see DeviceService.create).
    signature: z.string().min(1, "signature is required"),
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

export type EnrollDeviceInput = z.infer<typeof enrollDeviceSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;


export const deviceDecoder = {
    enroll: (data: unknown) => enrollDeviceSchema.safeParse(data),
    heartbeat: (data: unknown) => heartbeatSchema.safeParse(data),
    inventory: (data: unknown) => inventorySchema.safeParse(data),
};
