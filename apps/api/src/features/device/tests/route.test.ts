import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app + requireDeviceAuth middleware;
// only the repository and the better-auth JWT verification are mocked, so
// no real Postgres connection or JWT keyset is ever touched.
const { repoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: {
        createDevice: vi.fn(),
        findDeviceById: vi.fn(),
        touchHeartbeat: vi.fn(),
    },
    verifyJWTMock: vi.fn(),
}));

vi.mock("@features/device/repository", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    DeviceRepository: vi.fn(function () {
        return repoMock;
    }),
}));

vi.mock("@lib/auth", () => ({
    auth: { api: { verifyJWT: verifyJWTMock } },
}));

import { app } from "../../../app";

const heartbeatBody = { battery: 80, storageFreeBytes: 1_000, online: true, ts: Date.now() };

describe("POST /api/v1/devices/:deviceId/heartbeat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects a heartbeat with no bearer token", async () => {
        await request(app)
            .post("/api/v1/devices/device-1/heartbeat")
            .send(heartbeatBody)
            .expect(401);

        expect(repoMock.touchHeartbeat).not.toHaveBeenCalled();
    });

    it("rejects a heartbeat whose JWT subject doesn't match the enrolled device", async () => {
        verifyJWTMock.mockResolvedValue({ payload: { sub: "other-device", type: "device" } });

        await request(app)
            .post("/api/v1/devices/device-1/heartbeat")
            .set("Authorization", "Bearer valid-jwt")
            .send(heartbeatBody)
            .expect(403);

        expect(repoMock.touchHeartbeat).not.toHaveBeenCalled();
    });

    it("rejects a heartbeat for a device that isn't enrolled", async () => {
        verifyJWTMock.mockResolvedValue({ payload: { sub: "device-1", type: "device" } });
        repoMock.findDeviceById.mockResolvedValue({ id: "device-1", enrollementStatus: "pending" });

        await request(app)
            .post("/api/v1/devices/device-1/heartbeat")
            .set("Authorization", "Bearer valid-jwt")
            .send(heartbeatBody)
            .expect(401);

        expect(repoMock.touchHeartbeat).not.toHaveBeenCalled();
    });

    it("accepts a heartbeat for an enrolled device and refreshes its last-seen timestamp", async () => {
        verifyJWTMock.mockResolvedValue({ payload: { sub: "device-1", type: "device" } });
        repoMock.findDeviceById.mockResolvedValue({ id: "device-1", enrollementStatus: "enrolled" });

        const res = await request(app)
            .post("/api/v1/devices/device-1/heartbeat")
            .set("Authorization", "Bearer valid-jwt")
            .send(heartbeatBody)
            .expect(200);

        expect(res.body).toEqual({ ok: true });
        expect(repoMock.touchHeartbeat).toHaveBeenCalledWith("device-1");
    });
});
