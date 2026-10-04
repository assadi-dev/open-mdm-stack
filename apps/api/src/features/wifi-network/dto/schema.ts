import z from "zod";
import { wifiSecurityType } from "@drizzle/schemas/wifi-network-schema";
import { MAX_LIMIT } from "@features/paginations/domain/paginations";
import { createCollectionQuerySchema } from "@features/paginations/dto/schema";

// Admin -> API on POST /wifi-networks. An open network (security NONE) has no password;
// every other security type requires one.
export const createWifiNetworkSchema = z.object({
    name: z.string().min(1).optional(),
    ssid: z.string().min(1, "ssid is required"),
    password: z.string().min(1, "password is required").optional(),
    security: z.enum(wifiSecurityType),
}).refine(
    ({ security, password }) => security === "NONE" || password !== undefined,
    { message: "password is required", path: ["password"] },
);

// Admin -> API on PATCH /wifi-networks/:id. `name` accepts `null` to clear it
// explicitly, unlike the other fields which are simply left untouched when omitted.
export const updateWifiNetworkSchema = z.object({
    name: z.string().min(1).nullable().optional(),
    ssid: z.string().min(1).optional(),
    password: z.string().optional().nullable(),
    security: z.enum(wifiSecurityType).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one of name, ssid, password, security is required" },
);

// Admin -> API on DELETE /wifi-networks. Deleting one network is a list of one id: single and bulk
// deletion share this endpoint. Duplicated ids are collapsed.
export const deleteWifiNetworksSchema = z.object({
    ids: z.array(z.uuid()).min(1, "at least one id is required").max(MAX_LIMIT).transform((ids) => [...new Set(ids)]),
});

// Admin -> API on GET /wifi-networks?page=1&limit=20&search=office&sort=-createdAt,ssid&security=WPA2,WPA3
export const wifiNetworkCollectionQuerySchema = createCollectionQuerySchema({
    sortable: ["name", "ssid", "security", "createdAt"],
    filters: { security: z.enum(wifiSecurityType) },
});

export type CreateWifiNetworkInput = z.infer<typeof createWifiNetworkSchema>;
export type UpdateWifiNetworkInput = z.infer<typeof updateWifiNetworkSchema>;
export type DeleteWifiNetworksInput = z.infer<typeof deleteWifiNetworksSchema>;
export type WifiNetworkCollectionQuery = z.infer<typeof wifiNetworkCollectionQuerySchema>;

export const wifiNetworkDecoder = {
    create: (data: unknown) => createWifiNetworkSchema.safeParse(data),
    update: (data: unknown) => updateWifiNetworkSchema.safeParse(data),
    deleteMany: (data: unknown) => deleteWifiNetworksSchema.safeParse(data),
    collection: (data: unknown) => wifiNetworkCollectionQuerySchema.safeParse(data),
};
