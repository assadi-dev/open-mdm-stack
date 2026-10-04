import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { HTTPBadRequestException, HTTPNotFoundException, HTTPServiceUnavailableException } from "@core/exception";

// `vi.hoisted` runs alongside the hoisted `vi.mock` below, so `challengeRepoMock`
// is already initialized when the mock factory references it.
const { challengeRepoMock, otpRepoMock, wifiNetworkRepoMock } = vi.hoisted(() => ({
    challengeRepoMock: {
        create: vi.fn(),
        byChallenge: vi.fn(),
        markConsumed: vi.fn(),
    },
    otpRepoMock: {
        issue: vi.fn(),
        consume: vi.fn(),
    },
    wifiNetworkRepoMock: {
        findById: vi.fn(),
    },
}));

vi.mock("@features/enrollment/repositories", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
    OtpRepository: vi.fn(function () {
        return otpRepoMock;
    }),
}));

vi.mock("@features/wifi-network/repository", () => ({
    WifiNetworkRepository: vi.fn(function () {
        return wifiNetworkRepoMock;
    }),
}));

import { EnrollmentService } from "../service";
// Real implementation (not mocked) — resolveWifiNetwork decrypts what it
// reads back from the DB, so tests build fixtures through the same cipher.
import { encryptSecret } from "@lib/crypto";

describe("EnrollmentService", () => {
    let service: EnrollmentService;

    beforeEach(() => {
        vi.clearAllMocks();
        challengeRepoMock.create.mockResolvedValue({ id: "challenge-row" });
        otpRepoMock.issue.mockResolvedValue({ id: "otp-row" });
        service = new EnrollmentService();
    });

    describe("generateChallenge", () => {
        it("stores a random single-use challenge with the requested TTL", async () => {
            const result = await service.generateChallenge(120);

            expect(result.ttlSeconds).toBe(120);
            expect(typeof result.challenge).toBe("string");
            expect(result.challenge.length).toBeGreaterThan(0);
            expect(challengeRepoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({ challenge: result.challenge, consumedAt: null }),
            );
        });

        // Regression test: displayProvisioning calls generateChallenge(ttlSeconds)
        // where ttlSeconds can be undefined — this used to bottom out in
        // `new Date(NaN)` and crash the DB insert with "Invalid time value".
        it("falls back to a valid expiry when ttlSeconds is undefined", async () => {
            const result = await service.generateChallenge(undefined);

            expect(Number.isFinite(result.ttlSeconds)).toBe(true);
            expect(() => new Date(result.expiresAt).toISOString()).not.toThrow();
        });
    });

    describe("assertChallengeValid", () => {
        it("throws HTTPNotFoundException when the challenge does not exist", async () => {
            challengeRepoMock.byChallenge.mockResolvedValue(undefined);

            await expect(service.assertChallengeValid("missing")).rejects.toBeInstanceOf(HTTPNotFoundException);
        });

        it("throws HTTPBadRequestException when the challenge was already consumed", async () => {
            challengeRepoMock.byChallenge.mockResolvedValue({
                consumedAt: new Date(),
                expiresAt: new Date(Date.now() + 60_000),
            });

            await expect(service.assertChallengeValid("used")).rejects.toBeInstanceOf(HTTPBadRequestException);
        });

        it("throws HTTPBadRequestException when the challenge has expired", async () => {
            challengeRepoMock.byChallenge.mockResolvedValue({
                consumedAt: null,
                expiresAt: new Date(Date.now() - 1_000),
            });

            await expect(service.assertChallengeValid("expired")).rejects.toBeInstanceOf(HTTPBadRequestException);
        });

        it("returns the row when the challenge is valid and unused", async () => {
            const row = { id: "challenge-id", consumedAt: null, expiresAt: new Date(Date.now() + 60_000) };
            challengeRepoMock.byChallenge.mockResolvedValue(row);

            await expect(service.assertChallengeValid("valid")).resolves.toEqual(row);
        });
    });

    describe("consumeChallenge", () => {
        it("marks the challenge consumed and returns the updated row", async () => {
            challengeRepoMock.markConsumed.mockResolvedValue({ id: "challenge-id", consumedAt: new Date() });

            const result = await service.consumeChallenge("valid");

            expect(challengeRepoMock.markConsumed).toHaveBeenCalledWith("valid");
            expect(result.consumedAt).not.toBeNull();
        });
    });

    describe("generateOTP", () => {
        it("stores a 6-digit code expiring ENROLLMENT_OTP_TTL_SECONDS from now and returns it", async () => {
            const before = Date.now();

            const result = await service.generateOTP();

            expect(result.code).toMatch(/^\d{6}$/);
            expect(result.ttl).toBeGreaterThan(0);
            expect(otpRepoMock.issue).toHaveBeenCalledTimes(1);
            const { code, expiresAt } = otpRepoMock.issue.mock.calls[0][0];
            expect(code).toBe(result.code);
            // The expiry reported to the client is the one stored — not a window boundary, as with the old TOTP.
            expect(result.expiresAt).toBe(expiresAt.toISOString());
            expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + result.ttl * 1000);
            expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + result.ttl * 1000);
        });

        it("draws another code when the first ones are already pending", async () => {
            otpRepoMock.issue
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce(undefined)
                .mockResolvedValue({ id: "otp-row" });

            const result = await service.generateOTP();

            expect(otpRepoMock.issue).toHaveBeenCalledTimes(3);
            // The code handed back is the one that was actually stored, not one of the rejected draws.
            expect(result.code).toBe(otpRepoMock.issue.mock.calls[2][0].code);
        });

        it("answers 503 after MAX_OTP_ISSUE_ATTEMPTS collisions in a row", async () => {
            otpRepoMock.issue.mockResolvedValue(undefined);

            await expect(service.generateOTP()).rejects.toBeInstanceOf(HTTPServiceUnavailableException);
            expect(otpRepoMock.issue).toHaveBeenCalledTimes(10);
        });
    });

    describe("verifyOTP", () => {
        it("throws HTTPBadRequestException without minting a challenge when the OTP is unknown, expired or already used", async () => {
            otpRepoMock.consume.mockResolvedValue(undefined);

            await expect(
                service.verifyOTP({ otp: "000000", ttlSeconds: 120 }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(challengeRepoMock.create).not.toHaveBeenCalled();
        });

        it("consumes the OTP, then mints a challenge with the requested TTL", async () => {
            otpRepoMock.consume.mockResolvedValue({ id: "otp-row", consumedAt: new Date() });

            const result = await service.verifyOTP({ otp: "123456", ttlSeconds: 120 });

            expect(otpRepoMock.consume).toHaveBeenCalledWith("123456");
            expect(result.ttlSeconds).toBe(120);
            expect(challengeRepoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({ challenge: result.challenge, consumedAt: null }),
            );
            // Consumed first: a failure while minting the challenge must never leave a reusable code behind.
            expect(otpRepoMock.consume.mock.invocationCallOrder[0])
                .toBeLessThan(challengeRepoMock.create.mock.invocationCallOrder[0]);
        });
    });

    describe("displayProvisioning", () => {
        // The provisioning QR is only scanned during Device Owner setup, which can
        // easily outlast a short-lived challenge — the agent fetches its own fresh
        // challenge live instead (see MdmDeviceAdminReceiver), so no challenge is
        // minted/embedded here (and no throwaway DB row is created per QR generated).
        it("returns the JSON provisioning payload without minting a challenge", async () => {
            const result = (await service.displayProvisioning({
                body: {},
            })) as Record<string, unknown>;

            const extras = result[
                "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"
            ] as Record<string, unknown>;
            expect(extras).not.toHaveProperty("challenge");
            expect(challengeRepoMock.create).not.toHaveBeenCalled();
        });

        it("returns an SVG QR code embedding the same payload when format is svg", async () => {
            const result = await service.displayProvisioning({
                format: "svg",
                body: {},
            });

            expect(typeof result).toBe("string");
            expect(result as string).toContain("<svg");
        });

        it("rejects an invalid provisioning body with the underlying ZodError", async () => {
            await expect(
                service.displayProvisioning({
                    body: { wifiSecurityType: "NOT-A-TYPE" },
                }),
            ).rejects.toBeInstanceOf(ZodError);
        });

        describe("wifiId resolution", () => {
            const wifiNetworkRow = (overrides: object = {}) => ({
                id: "wifi-1",
                name: "Office",
                ssid: "office-ssid",
                password: encryptSecret("s3cr3t!"),
                security: "WPA2",
                createdAt: new Date(),
                updatedAt: new Date(),
                ...overrides,
            });

            it("looks up the stored network and decrypts its password into the payload", async () => {
                wifiNetworkRepoMock.findById.mockResolvedValue(wifiNetworkRow());

                const result = (await service.displayProvisioning({
                    body: { wifiId: "wifi-1" },
                })) as Record<string, unknown>;

                expect(wifiNetworkRepoMock.findById).toHaveBeenCalledWith("wifi-1");
                expect(result["android.app.extra.PROVISIONING_WIFI_SSID"]).toBe("office-ssid");
                // WPA2 (PSK family) is declared as "WPA" to Android — see WIFI_SECURITY_TYPE_MAP.
                expect(result["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"]).toBe("WPA");
                expect(result["android.app.extra.PROVISIONING_WIFI_PASSWORD"]).toBe("s3cr3t!");
            });

            it("omits the password for an open network stored without one", async () => {
                wifiNetworkRepoMock.findById.mockResolvedValue(wifiNetworkRow({ security: "NONE", password: null }));

                const result = (await service.displayProvisioning({
                    body: { wifiId: "wifi-1" },
                })) as Record<string, unknown>;

                expect(result["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"]).toBe("NONE");
                expect(result).not.toHaveProperty("android.app.extra.PROVISIONING_WIFI_PASSWORD");
            });

            it("leaves the Wi-Fi extras out when wifiId doesn't match any stored network", async () => {
                wifiNetworkRepoMock.findById.mockResolvedValue(undefined);

                const result = (await service.displayProvisioning({
                    body: { wifiId: "missing-wifi" },
                })) as Record<string, unknown>;

                expect(result).not.toHaveProperty("android.app.extra.PROVISIONING_WIFI_SSID");
                expect(result).not.toHaveProperty("android.app.extra.PROVISIONING_WIFI_PASSWORD");
            });

            it("does not query the wifi network repository when wifiId is not provided", async () => {
                await service.displayProvisioning({ body: {} });

                expect(wifiNetworkRepoMock.findById).not.toHaveBeenCalled();
            });
        });
    });
});
