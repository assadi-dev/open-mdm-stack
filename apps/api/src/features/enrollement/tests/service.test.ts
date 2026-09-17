import { beforeEach, describe, expect, it, vi } from "vitest";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";
import type { CreateEnrollmentTokenInput } from "../dto/schema";

// `vi.hoisted` runs alongside the hoisted `vi.mock` below, so `repoMock` is
// already initialized when the mock factory references it.
const { repoMock } = vi.hoisted(() => ({
    repoMock: {
        create: vi.fn(),
        getOne: vi.fn(),
        byToken: vi.fn(),
        markConsumed: vi.fn(),
        markUnused: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("@features/enrollement/repositories", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    EnrollmentTokenRepository: vi.fn(function () {
        return repoMock;
    }),
}));

import { EnrollementService } from "../service";

describe("EnrollementService", () => {
    let service: EnrollementService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new EnrollementService();
    });

    describe("generateToken", () => {
        it("stores a random single-use token with the requested TTL", async () => {
            repoMock.create.mockResolvedValue({ id: "row-1" });

            const result = await service.generateToken({ ttlSeconds: 120 });

            expect(result.ttlSeconds).toBe(120);
            expect(typeof result.token).toBe("string");
            expect(result.token.length).toBeGreaterThan(0);
            expect(repoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({ token: result.token, consumedAt: null }),
            );
        });
    });

    describe("consumeToken", () => {
        it("throws HTTPNotFoundException when the token does not exist", async () => {
            repoMock.byToken.mockResolvedValue(undefined);

            await expect(service.consumeToken("missing")).rejects.toBeInstanceOf(HTTPNotFoundException);
            expect(repoMock.markConsumed).not.toHaveBeenCalled();
        });

        it("throws HTTPBadRequestException when the token was already consumed", async () => {
            repoMock.byToken.mockResolvedValue({
                consumedAt: new Date(),
                expiresAt: new Date(Date.now() + 60_000),
            });

            await expect(service.consumeToken("used")).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(repoMock.markConsumed).not.toHaveBeenCalled();
        });

        it("throws HTTPBadRequestException when the token has expired", async () => {
            repoMock.byToken.mockResolvedValue({
                consumedAt: null,
                expiresAt: new Date(Date.now() - 1_000),
            });

            await expect(service.consumeToken("expired")).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(repoMock.markConsumed).not.toHaveBeenCalled();
        });

        it("marks a valid token consumed and returns the updated row", async () => {
            repoMock.byToken.mockResolvedValue({
                id: "token-id",
                consumedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            });
            repoMock.markConsumed.mockResolvedValue({ id: "token-id", consumedAt: new Date() });

            const result = await service.consumeToken("valid");

            expect(repoMock.markConsumed).toHaveBeenCalledWith("valid");
            expect(result.consumedAt).not.toBeNull();
        });
    });

    describe("buildProvisioningPayload", () => {
        const base: CreateEnrollmentTokenInput = {
            wifiSecurityType: "WPA2",
            wifiHidden: false,
            systemApps: true,
            skipEncryption: false,
        };

        it("maps WPA2/WPA3 to the Android-accepted WPA security type and includes the password", () => {
            const payload = service.buildProvisioningPayload({
                ...base,
                wifiSsid: "Office",
                wifiSecurityType: "WPA3",
                wifiPassword: "secret",
            });

            expect(payload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"]).toBe("WPA");
            expect(payload["android.app.extra.PROVISIONING_WIFI_PASSWORD"]).toBe("secret");
        });

        it("omits the Wi-Fi password when the security type is NONE", () => {
            const payload = service.buildProvisioningPayload({
                ...base,
                wifiSsid: "Guest",
                wifiSecurityType: "NONE",
                wifiPassword: "unused",
            });

            expect(payload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"]).toBe("NONE");
            expect(payload).not.toHaveProperty("android.app.extra.PROVISIONING_WIFI_PASSWORD");
        });

        it("forwards policyId/groupId into the admin extras bundle when provided", () => {
            const payload = service.buildProvisioningPayload({
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
});
