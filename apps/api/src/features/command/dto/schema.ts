import z from "zod";

// Admin -> API. One variant per command type so each payload is validated.
export const createCommandSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("lock") }),
    z.object({ type: z.literal("unlock") }),
    z.object({ type: z.literal("reboot") }),
    z.object({
        type: z.literal("set_lock_message"),
        // Shown on the lock screen (DevicePolicyManager.setDeviceOwnerLockScreenInfo).
        // Empty string clears it.
        payload: z.object({ message: z.string().max(200) }),
    }),
    z.object({
        type: z.literal("remove_device_owner"),
        // Relinquishes Device Owner (self-service, always possible). No way
        // back remotely: Android has no API to (re-)grant Device Owner —
        // only `adb shell dpm set-device-owner` or full re-provisioning
        // (QR/NFC) can do that. Testing/decommissioning only, not a normal
        // fleet operation.
    }),
]);

// Device -> API on mdm/devices/{id}/acks.
export const commandAckSchema = z.object({
    commandId: z.uuid(),
    status: z.enum(["acknowledged", "succeeded", "failed"]),
    result: z.record(z.string(), z.unknown()).optional(),
    error: z.string().max(2000).optional(),
});

// Device -> API on mdm/devices/{id}/status (retained, also the Last Will).
export const deviceStatusSchema = z.object({
    state: z.enum(["online", "offline"]),
});

// Device -> API on mdm/devices/{id}/screen (retained). Reported independently
// of commands, e.g. the user manually locking/unlocking the device.
export const deviceScreenSchema = z.object({
    locked: z.boolean(),
});

export type CreateCommandInput = z.infer<typeof createCommandSchema>;
export type CommandAckInput = z.infer<typeof commandAckSchema>;
export type DeviceStatusInput = z.infer<typeof deviceStatusSchema>;
export type DeviceScreenInput = z.infer<typeof deviceScreenSchema>;

export const commandDecoder = {
    create: (data: unknown) => createCommandSchema.safeParse(data),
    ack: (data: unknown) => commandAckSchema.safeParse(data),
    status: (data: unknown) => deviceStatusSchema.safeParse(data),
    screen: (data: unknown) => deviceScreenSchema.safeParse(data),
};
