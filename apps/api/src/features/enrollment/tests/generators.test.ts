import { describe, expect, it } from "vitest";
import { generateRandomChallenge, buildProvisioningPayload } from "../utils/generators";
import type { CreateProvisioningPayloadInput } from "../dto/schema";

describe("generateRandomChallenge", () => {
    it("produces a random single-use challenge expiring `ttlSeconds` from now", () => {
        const before = Date.now();

        const result = generateRandomChallenge(120);

        const after = Date.now();
        expect(typeof result.challenge).toBe("string");
        expect(result.challenge.length).toBeGreaterThan(0);
        expect(result.ttlSeconds).toBe(120);
        expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 120_000);
        expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + 120_000);
    });

    it("generates a different challenge on every call", () => {
        const a = generateRandomChallenge(60);
        const b = generateRandomChallenge(60);

        expect(a.challenge).not.toBe(b.challenge);
    });

    it("falls back to the configured TTL, with a valid (non-NaN) expiry, when called with no ttlSeconds", () => {
        const result = generateRandomChallenge();

        expect(Number.isFinite(result.ttlSeconds)).toBe(true);
        expect(Number.isNaN(result.expiresAt.getTime())).toBe(false);
    });
});

describe("buildProvisioningPayload", () => {
    const base: CreateProvisioningPayloadInput = {
        challenge: "the-enrollment-challenge",
        wifiSecurityType: "WPA2",
        wifiHidden: false,
        systemApps: true,
        skipEncryption: false,
    };

    it("embeds the challenge in the admin extras bundle", () => {
        const payload = buildProvisioningPayload(base);

        const extras = payload[
            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"
        ] as Record<string, unknown>;
        expect(extras.challenge).toBe("the-enrollment-challenge");
    });

    it("maps WPA2/WPA3 to the Android-accepted WPA security type and includes the password", () => {
        const payload = buildProvisioningPayload({
            ...base,
            wifiSsid: "Office",
            wifiSecurityType: "WPA3",
            wifiPassword: "secret",
        });

        expect(payload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"]).toBe("WPA");
        expect(payload["android.app.extra.PROVISIONING_WIFI_PASSWORD"]).toBe("secret");
    });

    it("omits the Wi-Fi password when the security type is NONE", () => {
        const payload = buildProvisioningPayload({
            ...base,
            wifiSsid: "Guest",
            wifiSecurityType: "NONE",
            wifiPassword: "unused",
        });

        expect(payload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"]).toBe("NONE");
        expect(payload).not.toHaveProperty("android.app.extra.PROVISIONING_WIFI_PASSWORD");
    });

    it("forwards policyId/groupId into the admin extras bundle when provided", () => {
        const payload = buildProvisioningPayload({
            ...base,
            policyId: "policy-1",
            groupId: "group-1",
        });

        const extras = payload[
            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"
        ] as Record<string, unknown>;
        expect(extras.policyId).toBe("policy-1");
        expect(extras.groupId).toBe("group-1");
    });
});
