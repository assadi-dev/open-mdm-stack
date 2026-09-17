import { describe, expect, it } from "vitest";
import { generateRandomToken, buildProvisioningPayload } from "../utils/generators";
import type { CreateEnrollmentTokenInput, CreateTokenInput } from "../dto/schema";

describe("generateRandomToken", () => {
    it("produces a random single-use token expiring `ttlSeconds` from now", () => {
        const before = Date.now();

        const result = generateRandomToken({ ttlSeconds: 120 } as CreateTokenInput);

        const after = Date.now();
        expect(typeof result.token).toBe("string");
        expect(result.token.length).toBeGreaterThan(0);
        expect(result.ttlSeconds).toBe(120);
        expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 120_000);
        expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after + 120_000);
    });

    it("generates a different token on every call", () => {
        const a = generateRandomToken({ ttlSeconds: 60 } as CreateTokenInput);
        const b = generateRandomToken({ ttlSeconds: 60 } as CreateTokenInput);

        expect(a.token).not.toBe(b.token);
    });

    // Regression test: the caller (EnrollementService.generateToken) can pass
    // an object whose `ttlSeconds` is undefined even though the TS type says
    // it's always a number — that's exactly what reached this function when
    // POST /provisioning was called with no ?ttlSeconds= query param, and it
    // used to produce `new Date(NaN)` (crashed later on insert).
    it("falls back to the configured TTL, with a valid (non-NaN) expiry, when ttlSeconds is missing", () => {
        const result = generateRandomToken({} as CreateTokenInput);

        expect(Number.isFinite(result.ttlSeconds)).toBe(true);
        expect(Number.isNaN(result.expiresAt.getTime())).toBe(false);
    });
});

describe("buildProvisioningPayload", () => {
    const base: CreateEnrollmentTokenInput = {
        token: "the-enrollment-token",
        wifiSecurityType: "WPA2",
        wifiHidden: false,
        systemApps: true,
        skipEncryption: false,
    };

    it("embeds the enrollment token in the admin extras bundle", () => {
        const payload = buildProvisioningPayload(base);

        const extras = payload[
            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"
        ] as Record<string, unknown>;
        expect(extras.token).toBe("the-enrollment-token");
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
