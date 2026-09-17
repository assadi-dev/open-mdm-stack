import { generateKeyPairSync, sign as cryptoSign } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";

const { repoMock, tokenRepoMock, challengeRepoMock, signJWTMock } = vi.hoisted(() => ({
    repoMock: {
        createDevice: vi.fn(),
        findDeviceById: vi.fn(),
        findByAndroidId: vi.fn(),
        reEnrollDevice: vi.fn(),
        touchHeartbeat: vi.fn(),
    },
    tokenRepoMock: {
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
    signJWTMock: vi.fn(),
}));

vi.mock("@features/device/repository", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    DeviceRepository: vi.fn(function () {
        return repoMock;
    }),
}));

vi.mock("@features/enrollement/repositories", () => ({
    EnrollmentTokenRepository: vi.fn(function () {
        return tokenRepoMock;
    }),
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
}));

// DeviceService.create runs inside db.transaction(async (tx) => ...); the
// mocked repositories above ignore the `tx` they're constructed with, so a
// bare object stands in for the transaction handle.
vi.mock("@drizzle/instance", () => ({
    db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run({})) },
}));

vi.mock("@lib/auth", () => ({
    auth: { api: { signJWT: signJWTMock } },
}));

import { generateCanonicalMessage } from "@features/enrollement/utils/canonical-message";
import { DeviceService } from "../service";

// Real EC key pair — exercises the actual verifyDeviceSignature path (Node's
// crypto module) rather than mocking it away.
function makeMockKeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    return {
        publicKeyBase64: publicKey.export({ type: "spki", format: "der" }).toString("base64"),
        sign: (data: string) => cryptoSign("sha256", Buffer.from(data), privateKey).toString("base64"),
    };
}

const keyPair = makeMockKeyPair();
const otherKeyPair = makeMockKeyPair();

const deviceInfo = {
    model: "Pixel 8",
    manufacturer: "Google",
    osVersion: "Android 14",
    serial: "abc123",
    publicKey: keyPair.publicKeyBase64,
};

const CHALLENGE = "the-challenge";
const TIMESTAMP = "2026-01-01T00:00:00.000Z";

function signEnrollment(kp: ReturnType<typeof makeMockKeyPair>, overrides: Partial<Parameters<typeof generateCanonicalMessage>[0]> = {}) {
    const canonicalMessage = generateCanonicalMessage({
        model: deviceInfo.model,
        manufacturer: deviceInfo.manufacturer,
        osVersion: deviceInfo.osVersion,
        serialNumber: deviceInfo.serial,
        imei: "",
        macAddress: "",
        androidId: "",
        method: "",
        timestamp: TIMESTAMP,
        publicKey: kp.publicKeyBase64,
        challenge: CHALLENGE,
        ...overrides,
    });
    return kp.sign(canonicalMessage);
}

function validChallengeRow() {
    return { id: "challenge-uuid", consumedAt: null, expiresAt: new Date(Date.now() + 60_000) };
}

describe("DeviceService", () => {
    let service: DeviceService;

    beforeEach(() => {
        vi.clearAllMocks();
        signJWTMock.mockResolvedValue({ token: "signed-device-jwt" });
        challengeRepoMock.byChallenge.mockResolvedValue(validChallengeRow());
        challengeRepoMock.markConsumed.mockResolvedValue({ ...validChallengeRow(), consumedAt: new Date() });
        repoMock.findByAndroidId.mockResolvedValue(undefined);
        service = new DeviceService();
    });

    describe("create", () => {
        it("verifies the proof-of-possession signature, consumes the token and challenge, creates the device, and issues a device JWT", async () => {
            tokenRepoMock.byToken.mockResolvedValue({
                id: "token-uuid",
                consumedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            });
            tokenRepoMock.markConsumed.mockResolvedValue({ id: "token-uuid", consumedAt: new Date() });
            repoMock.createDevice.mockResolvedValue({ id: "device-uuid" });

            const result = await service.create({
                enrollmentToken: "the-token",
                challenge: CHALLENGE,
                timestamp: TIMESTAMP,
                signature: signEnrollment(keyPair),
                device: deviceInfo,
            });

            expect(tokenRepoMock.markConsumed).toHaveBeenCalledWith("the-token");
            expect(challengeRepoMock.markConsumed).toHaveBeenCalledWith(CHALLENGE);
            expect(repoMock.createDevice).toHaveBeenCalledWith(
                expect.objectContaining({
                    enrollmentId: "token-uuid",
                    status: "enrolled",
                    serial: deviceInfo.serial,
                    model: deviceInfo.model,
                    manufacturer: deviceInfo.manufacturer,
                    osVersion: deviceInfo.osVersion,
                    publicKey: deviceInfo.publicKey,
                }),
            );
            expect(result).toEqual({ deviceId: "device-uuid", deviceToken: "signed-device-jwt" });
        });

        it("rejects with HTTPNotFoundException and never creates a device when the token doesn't exist", async () => {
            tokenRepoMock.byToken.mockResolvedValue(undefined);

            await expect(
                service.create({
                    enrollmentToken: "missing",
                    challenge: CHALLENGE,
                    timestamp: TIMESTAMP,
                    signature: signEnrollment(keyPair),
                    device: deviceInfo,
                }),
            ).rejects.toBeInstanceOf(HTTPNotFoundException);
            expect(repoMock.createDevice).not.toHaveBeenCalled();
        });

        it("rejects with HTTPBadRequestException and never creates a device when the token is already consumed", async () => {
            tokenRepoMock.byToken.mockResolvedValue({
                id: "token-uuid",
                consumedAt: new Date(),
                expiresAt: new Date(Date.now() + 60_000),
            });

            await expect(
                service.create({
                    enrollmentToken: "used",
                    challenge: CHALLENGE,
                    timestamp: TIMESTAMP,
                    signature: signEnrollment(keyPair),
                    device: deviceInfo,
                }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(repoMock.createDevice).not.toHaveBeenCalled();
        });

        it("rejects with HTTPBadRequestException and never consumes the token when the challenge is already consumed", async () => {
            tokenRepoMock.byToken.mockResolvedValue({
                id: "token-uuid",
                consumedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            });
            challengeRepoMock.byChallenge.mockResolvedValue({
                consumedAt: new Date(),
                expiresAt: new Date(Date.now() + 60_000),
            });

            await expect(
                service.create({
                    enrollmentToken: "the-token",
                    challenge: CHALLENGE,
                    timestamp: TIMESTAMP,
                    signature: signEnrollment(keyPair),
                    device: deviceInfo,
                }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(tokenRepoMock.markConsumed).not.toHaveBeenCalled();
            expect(repoMock.createDevice).not.toHaveBeenCalled();
        });

        it("rejects an invalid signature without consuming the token or challenge (so it can be retried)", async () => {
            tokenRepoMock.byToken.mockResolvedValue({
                id: "token-uuid",
                consumedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            });

            await expect(
                service.create({
                    enrollmentToken: "the-token",
                    challenge: CHALLENGE,
                    timestamp: TIMESTAMP,
                    // Signed by a *different* key pair than the one declared in `device.publicKey`.
                    signature: signEnrollment(otherKeyPair),
                    device: deviceInfo,
                }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(tokenRepoMock.markConsumed).not.toHaveBeenCalled();
            expect(challengeRepoMock.markConsumed).not.toHaveBeenCalled();
            expect(repoMock.createDevice).not.toHaveBeenCalled();
        });

        it("rejects a signature computed over a tampered field (e.g. a different challenge than the one validated)", async () => {
            tokenRepoMock.byToken.mockResolvedValue({
                id: "token-uuid",
                consumedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            });

            await expect(
                service.create({
                    enrollmentToken: "the-token",
                    challenge: CHALLENGE,
                    timestamp: TIMESTAMP,
                    // Signed over a different challenge than the one submitted/validated.
                    signature: signEnrollment(keyPair, { challenge: "some-other-challenge" }),
                    device: deviceInfo,
                }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
            expect(repoMock.createDevice).not.toHaveBeenCalled();
        });

        it("turns a unique-constraint violation on device creation into HTTPBadRequestException", async () => {
            tokenRepoMock.byToken.mockResolvedValue({
                id: "token-uuid",
                consumedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            });
            tokenRepoMock.markConsumed.mockResolvedValue({ id: "token-uuid", consumedAt: new Date() });
            repoMock.createDevice.mockRejectedValue({ code: "23505" });

            await expect(
                service.create({
                    enrollmentToken: "the-token",
                    challenge: CHALLENGE,
                    timestamp: TIMESTAMP,
                    signature: signEnrollment(keyPair),
                    device: deviceInfo,
                }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
        });

        describe("key pinning (androidId continuity)", () => {
            const pinnedDeviceInfo = { ...deviceInfo, androidId: "android-id-1" };

            function signPinned(kp: ReturnType<typeof makeMockKeyPair>) {
                return signEnrollment(kp, { androidId: "android-id-1" });
            }

            beforeEach(() => {
                tokenRepoMock.byToken.mockResolvedValue({
                    id: "token-uuid-2",
                    consumedAt: null,
                    expiresAt: new Date(Date.now() + 60_000),
                });
                tokenRepoMock.markConsumed.mockResolvedValue({ id: "token-uuid-2", consumedAt: new Date() });
            });

            it("re-enrolls in place when the same androidId presents the same pinned public key", async () => {
                repoMock.findByAndroidId.mockResolvedValue({ id: "existing-device-uuid", publicKey: keyPair.publicKeyBase64 });
                repoMock.reEnrollDevice.mockResolvedValue({ id: "existing-device-uuid" });

                const result = await service.create({
                    enrollmentToken: "the-token",
                    challenge: CHALLENGE,
                    timestamp: TIMESTAMP,
                    signature: signPinned(keyPair),
                    device: pinnedDeviceInfo,
                });

                expect(repoMock.reEnrollDevice).toHaveBeenCalledWith(
                    "existing-device-uuid",
                    expect.objectContaining({ enrollmentId: "token-uuid-2" }),
                );
                expect(repoMock.createDevice).not.toHaveBeenCalled();
                expect(result).toEqual({ deviceId: "existing-device-uuid", deviceToken: "signed-device-jwt" });
            });

            it("rejects re-enrollment when the same androidId presents a different public key than the pinned one", async () => {
                repoMock.findByAndroidId.mockResolvedValue({ id: "existing-device-uuid", publicKey: otherKeyPair.publicKeyBase64 });

                await expect(
                    service.create({
                        enrollmentToken: "the-token",
                        challenge: CHALLENGE,
                        timestamp: TIMESTAMP,
                        signature: signPinned(keyPair),
                        device: pinnedDeviceInfo,
                    }),
                ).rejects.toBeInstanceOf(HTTPBadRequestException);
                expect(repoMock.reEnrollDevice).not.toHaveBeenCalled();
                expect(repoMock.createDevice).not.toHaveBeenCalled();
            });
        });
    });

    it("recordHeartbeat refreshes the device's last-seen timestamp", async () => {
        await service.recordHeartbeat("device-1");

        expect(repoMock.touchHeartbeat).toHaveBeenCalledWith("device-1");
    });

    it("recordInventory also refreshes the heartbeat timestamp (an inventory push counts as a check-in)", async () => {
        await service.recordInventory("device-1", {
            os: "Android 14",
            model: "Pixel 8",
            manufacturer: "Google",
            serial: "abc123",
            storage: { totalBytes: 1000, freeBytes: 500 },
            apps: [],
        });

        expect(repoMock.touchHeartbeat).toHaveBeenCalledWith("device-1");
    });
});
