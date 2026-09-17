import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";

// `vi.hoisted` runs alongside the hoisted `vi.mock` below, so `challengeRepoMock`
// is already initialized when the mock factory references it.
const { challengeRepoMock } = vi.hoisted(() => ({
    challengeRepoMock: {
        create: vi.fn(),
        byChallenge: vi.fn(),
        markConsumed: vi.fn(),
    },
}));

vi.mock("@features/enrollment/repositories", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
}));

import { EnrollmentService } from "../service";

describe("EnrollmentService", () => {
    let service: EnrollmentService;

    beforeEach(() => {
        vi.clearAllMocks();
        challengeRepoMock.create.mockResolvedValue({ id: "challenge-row" });
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

    describe("verifyOTP", () => {
        it("throws HTTPBadRequestException without minting a challenge when the OTP is invalid", async () => {
            await expect(
                service.verifyOTP({ otp: "000000", ttlSeconds: 120 }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(challengeRepoMock.create).not.toHaveBeenCalled();
        });
    });

    describe("displayProvisioning", () => {
        it("mints a fresh challenge and returns the JSON provisioning payload carrying it", async () => {
            const result = (await service.displayProvisioning({
                ttlSeconds: 120,
                body: {},
            })) as Record<string, unknown>;

            const extras = result[
                "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"
            ] as Record<string, unknown>;
            expect(typeof extras.challenge).toBe("string");
            expect((extras.challenge as string).length).toBeGreaterThan(0);
            expect(challengeRepoMock.create).toHaveBeenCalledTimes(1);
        });

        it("returns an SVG QR code embedding the same payload when format is svg", async () => {
            const result = await service.displayProvisioning({
                format: "svg",
                ttlSeconds: 120,
                body: {},
            });

            expect(typeof result).toBe("string");
            expect(result as string).toContain("<svg");
        });

        it("rejects an invalid provisioning body with the underlying ZodError", async () => {
            await expect(
                service.displayProvisioning({
                    ttlSeconds: 120,
                    body: { wifiSecurityType: "NOT-A-TYPE" },
                }),
            ).rejects.toBeInstanceOf(ZodError);
        });
    });
});
