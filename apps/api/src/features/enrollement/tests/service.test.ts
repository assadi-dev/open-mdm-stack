import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";
import type { CreateTokenInput } from "../dto/schema";

// `vi.hoisted` runs alongside the hoisted `vi.mock` below, so `repoMock` is
// already initialized when the mock factory references it.
const { repoMock, challengeRepoMock } = vi.hoisted(() => ({
    repoMock: {
        create: vi.fn(),
        getOne: vi.fn(),
        byToken: vi.fn(),
        markConsumed: vi.fn(),
        markUnused: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    challengeRepoMock: {
        create: vi.fn(),
        byChallenge: vi.fn(),
        markConsumed: vi.fn(),
    },
}));

vi.mock("@features/enrollement/repositories", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    EnrollmentTokenRepository: vi.fn(function () {
        return repoMock;
    }),
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
}));

import { EnrollementService } from "../service";

describe("EnrollementService", () => {
    let service: EnrollementService;

    beforeEach(() => {
        vi.clearAllMocks();
        repoMock.create.mockResolvedValue({ id: "row-1" });
        service = new EnrollementService();
    });

    describe("generateToken", () => {
        it("stores a random single-use token with the requested TTL", async () => {
            const result = await service.generateToken({ ttlSeconds: 120 } as CreateTokenInput);

            expect(result.ttlSeconds).toBe(120);
            expect(typeof result.token).toBe("string");
            expect(result.token.length).toBeGreaterThan(0);
            expect(repoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({ token: result.token, consumedAt: null }),
            );
        });

        // Regression test: displayProvisioning calls generateToken({ ttlSeconds })
        // where ttlSeconds can be undefined — this used to bottom out in
        // `new Date(NaN)` and crash the DB insert with "Invalid time value".
        it("falls back to a valid expiry when ttlSeconds is undefined", async () => {
            const result = await service.generateToken({ ttlSeconds: undefined } as CreateTokenInput);

            expect(Number.isFinite(result.ttlSeconds)).toBe(true);
            expect(() => new Date(result.expiresAt).toISOString()).not.toThrow();
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

    describe("generateChallenge", () => {
        it("stores a random single-use challenge", async () => {
            challengeRepoMock.create.mockResolvedValue({ id: "challenge-row" });

            const result = await service.generateChallenge();

            expect(typeof result.challenge).toBe("string");
            expect(result.challenge.length).toBeGreaterThan(0);
            expect(challengeRepoMock.create).toHaveBeenCalledWith(
                expect.objectContaining({ challenge: result.challenge, consumedAt: null }),
            );
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

    describe("displayProvisioning", () => {
        it("mints a fresh token and returns the JSON provisioning payload carrying it", async () => {
            const result = (await service.displayProvisioning({
                ttlSeconds: 120,
                body: {},
            })) as Record<string, unknown>;

            const extras = result[
                "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"
            ] as Record<string, unknown>;
            expect(typeof extras.token).toBe("string");
            expect((extras.token as string).length).toBeGreaterThan(0);
            expect(repoMock.create).toHaveBeenCalledTimes(1);
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
