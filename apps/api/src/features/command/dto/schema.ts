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

export type CreateCommandInput = z.infer<typeof createCommandSchema>;
export type CommandAckInput = z.infer<typeof commandAckSchema>;
export type DeviceStatusInput = z.infer<typeof deviceStatusSchema>;

export const commandDecoder = {
    create: (data: unknown) => createCommandSchema.safeParse(data),
    ack: (data: unknown) => commandAckSchema.safeParse(data),
    status: (data: unknown) => deviceStatusSchema.safeParse(data),
};
