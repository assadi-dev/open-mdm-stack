import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { repoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: { findDeviceById: vi.fn() },
    verifyJWTMock: vi.fn(),
}));

vi.mock("@features/device/repository", () => ({
    DeviceRepository: vi.fn(function () {
        return repoMock;
    }),
}));

vi.mock("@lib/auth", () => ({
    auth: { api: { verifyJWT: verifyJWTMock } },
}));

import { app } from "../../../app";

const DEVICE_ID = "7f1c2e4a-9b3d-4c5e-8f6a-1b2c3d4e5f60";
const post = (body: object) => request(app).post("/api/v1/mqtt/auth").send(body).expect(200);

describe("POST /api/v1/mqtt/auth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("grants superuser to the backend credentials", async () => {
        const res = await post({ clientid: "mdm-api", username: "mdm-api", password: "test-mqtt-backend-password" });
        expect(res.body).toEqual({ result: "allow", is_superuser: true });
    });

    it("denies the backend username with a wrong password, without trying it as a JWT", async () => {
        const res = await post({ clientid: "mdm-api", username: "mdm-api", password: "nope" });
        expect(res.body).toEqual({ result: "deny" });
        expect(verifyJWTMock).not.toHaveBeenCalled();
    });

    it("allows an enrolled device whose clientid matches its JWT subject", async () => {
        verifyJWTMock.mockResolvedValue({ payload: { sub: DEVICE_ID, type: "device" } });
        repoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus: "enrolled" });

        const res = await post({ clientid: DEVICE_ID, username: DEVICE_ID, password: "device.jwt" });
        expect(res.body).toEqual({ result: "allow", is_superuser: false });
    });

    it("denies a device connecting under another device's clientid", async () => {
        verifyJWTMock.mockResolvedValue({ payload: { sub: DEVICE_ID, type: "device" } });

        const res = await post({ clientid: "11111111-2222-4333-8444-555555555555", password: "device.jwt" });
        expect(res.body).toEqual({ result: "deny" });
        expect(repoMock.findDeviceById).not.toHaveBeenCalled();
    });

    it("denies a revoked device", async () => {
        verifyJWTMock.mockResolvedValue({ payload: { sub: DEVICE_ID, type: "device" } });
        repoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus: "revoked" });

        const res = await post({ clientid: DEVICE_ID, password: "device.jwt" });
        expect(res.body).toEqual({ result: "deny" });
    });

    it("denies a non-device JWT (e.g. an admin token)", async () => {
        verifyJWTMock.mockResolvedValue({ payload: { sub: DEVICE_ID } });

        const res = await post({ clientid: DEVICE_ID, password: "admin.jwt" });
        expect(res.body).toEqual({ result: "deny" });
    });

    it("denies an invalid JWT and a missing password", async () => {
        verifyJWTMock.mockRejectedValue(new Error("bad signature"));

        expect((await post({ clientid: DEVICE_ID, password: "garbage" })).body).toEqual({ result: "deny" });
        expect((await post({ clientid: DEVICE_ID })).body).toEqual({ result: "deny" });
    });
});
