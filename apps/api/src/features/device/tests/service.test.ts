import { beforeEach, describe, expect, it, vi } from "vitest";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";

const { repoMock, tokenRepoMock, signJWTMock } = vi.hoisted(() => ({
    repoMock: {
        createDevice: vi.fn(),
        findDeviceById: vi.fn(),
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

import { DeviceService } from "../service";

const deviceInfo = {
    model: "Pixel 8",
    manufacturer: "Google",
    osVersion: "Android 14",
    serial: "abc123",
};

describe("DeviceService", () => {
    let service: DeviceService;

    beforeEach(() => {
        vi.clearAllMocks();
        signJWTMock.mockResolvedValue({ token: "signed-device-jwt" });
        service = new DeviceService();
    });

    describe("create", () => {
        it("consumes the enrollment token, creates the device, and issues a device JWT", async () => {
            tokenRepoMock.byToken.mockResolvedValue({
                id: "token-uuid",
                consumedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            });
            tokenRepoMock.markConsumed.mockResolvedValue({ id: "token-uuid", consumedAt: new Date() });
            repoMock.createDevice.mockResolvedValue({ id: "device-uuid" });

            const result = await service.create({
                enrollmentToken: "the-token",
                device: deviceInfo,
            });

            expect(tokenRepoMock.markConsumed).toHaveBeenCalledWith("the-token");
            expect(repoMock.createDevice).toHaveBeenCalledWith(
                expect.objectContaining({
                    enrollmentId: "token-uuid",
                    status: "enrolled",
                    serial: deviceInfo.serial,
                    model: deviceInfo.model,
                    manufacturer: deviceInfo.manufacturer,
                    osVersion: deviceInfo.osVersion,
                }),
            );
            expect(result).toEqual({ deviceId: "device-uuid", deviceToken: "signed-device-jwt" });
        });

        it("rejects with HTTPNotFoundException and never creates a device when the token doesn't exist", async () => {
            tokenRepoMock.byToken.mockResolvedValue(undefined);

            await expect(
                service.create({ enrollmentToken: "missing", device: deviceInfo }),
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
                service.create({ enrollmentToken: "used", device: deviceInfo }),
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
                service.create({ enrollmentToken: "the-token", device: deviceInfo }),
            ).rejects.toBeInstanceOf(HTTPBadRequestException);
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
