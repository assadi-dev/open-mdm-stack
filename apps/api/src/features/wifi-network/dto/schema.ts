import z from "zod";
import { wifiSecurityType } from "@drizzle/schemas/wifi-network-schema";

export const createWifiNetworkSchema = z.object({
    name: z.string().min(1).optional(),
    ssid: z.string().min(1, "ssid is required"),
    password: z.string().min(1, "password is required"),
    security: z.enum(wifiSecurityType),
});

// Admin -> API on PATCH /wifi-networks/:id. `name` accepts `null` to clear it
// explicitly, unlike the other fields which are simply left untouched when omitted.
export const updateWifiNetworkSchema = z.object({
    name: z.string().min(1).nullable().optional(),
    ssid: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    security: z.enum(wifiSecurityType).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one of name, ssid, password, security is required" },
);

export type CreateWifiNetworkInput = z.infer<typeof createWifiNetworkSchema>;
export type UpdateWifiNetworkInput = z.infer<typeof updateWifiNetworkSchema>;

export const wifiNetworkDecoder = {
    create: (data: unknown) => createWifiNetworkSchema.safeParse(data),
    update: (data: unknown) => updateWifiNetworkSchema.safeParse(data),
};
