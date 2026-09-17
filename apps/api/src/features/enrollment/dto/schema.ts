import { ENV } from "@config/env";
import z from "zod";


export const createProvisioningPayloadSchema = z.object({
    challenge: z.string().min(1, "challenge is required"),
    apkUrl: z.string().optional(),
    wifiSsid: z.string().optional(),
    wifiPassword: z.string().optional(),
    // Friendly value; mapped to the Android-accepted token (WPA2/WPA3 -> "WPA")
    // in the provisioning payload. Defaults to WPA2 when a Wi-Fi SSID is set.
    wifiSecurityType: z
        .enum(["NONE", "WEP", "WPA", "WPA2", "WPA3", "EAP"])
        .optional()
        .default("WPA2"),
    // Only needed for non-broadcast (hidden) SSIDs.
    wifiHidden: z.boolean().optional().default(false),
    systemApps: z.boolean().optional().default(true),
    policyId: z.string().optional(),
    groupId: z.string().optional(),
    checksum: z.string().optional(),
    skipEncryption: z.boolean().optional().default(false),

});

export const createChallengeSchema = z.object({
    ttlSeconds: z.coerce.number().int().default(Number(ENV.ENROLLMENT_CHALLENGE_TTL_SECONDS)),
})


export type CreateProvisioningPayloadInput = z.infer<typeof createProvisioningPayloadSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;