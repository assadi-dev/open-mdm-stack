import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + requireAuth
// + error handler all run for real); only the repositories, the MQTT gateway
// and the better-auth JWT verification are mocked, so no real Postgres or
// broker connection is ever opened. The device answers on the first poll, so
// the 15 s wait never runs here (the timeout is covered by the command service tests).
const { repoMock, commandRepoMock, publishJsonMock, challengeRepoMock, authRepoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: {
        findDeviceById: vi.fn(),
        findOverviewById: vi.fn(),
    },
    commandRepoMock: {
        create: vi.fn(),
        markSent: vi.fn(),
        findById: vi.fn(),
        expire: vi.fn(),
    },
    publishJsonMock: vi.fn(),
    challengeRepoMock: {
        create: vi.fn(),
        byChallenge: vi.fn(),
        markConsumed: vi.fn(),
    },
    authRepoMock: {
        getUserSession: vi.fn(),
    },
    verifyJWTMock: vi.fn(),
}));

vi.mock("@features/device/repository", () => ({
    DeviceRepository: vi.fn(function () {
        return repoMock;
    }),
}));

vi.mock("@features/command/repository", () => ({
    CommandRepository: vi.fn(function () {
        return commandRepoMock;
    }),
}));

vi.mock("@lib/mqtt", () => ({
    mqttGateway: { publishJson: publishJsonMock },
    mqttTopics: { commands: (id: string) => `mdm/devices/${id}/commands` },
}));

vi.mock("@features/enrollment/repositories", () => ({
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
    // DeviceService builds an EnrollmentService, which also wants the OTP repository — not exercised here.
    OtpRepository: vi.fn(function () {
        return {};
    }),
}));

vi.mock("@features/auth/repository", () => ({
    AuthRepository: vi.fn(function () {
        return authRepoMock;
    }),
}));

vi.mock("@lib/auth", () => ({
    auth: { api: { verifyJWT: verifyJWTMock } },
}));

import { app } from "../../../app";

const FIRST_ID = "7f1c2e4a-9b3d-4c5e-8f6a-1b2c3d4e5f60";
const SECOND_ID = "0a9b8c7d-6e5f-4a3b-9c2d-1e0f9a8b7c6d";
const THIRD_ID = "5d4c3b2a-1f0e-4d9c-8b7a-6f5e4d3c2b1a";
const COMMAND_ID = "0b6f1d2e-3c4a-4b5c-9d6e-7f8091a2b3c4";

const authenticate = () => {
    verifyJWTMock.mockResolvedValue({ payload: { sub: "session-token" } });
    authRepoMock.getUserSession.mockResolvedValue({ token: "session-token", user: { id: "user-1" } });
};

const device = (id: string, overrides: object = {}) => ({ id, enrollmentStatus: "enrolled", online: true, ...overrides });

// What the repository returns for a command: `publish` serializes its dates.
const commandRow = (deviceId: string) => ({
    id: COMMAND_ID,
    deviceId,
    type: "refresh",
    payload: {},
    createdAt: new Date("2026-10-03T12:00:00Z"),
    expiresAt: new Date("2026-10-03T12:00:20Z"),
});

// A device that takes the command and completes it on the first poll.
const deviceCompletes = (status: "succeeded" | "failed" = "succeeded", error?: string) => {
    commandRepoMock.create.mockImplementation(async (input: { deviceId: string }) => commandRow(input.deviceId));
    commandRepoMock.findById.mockResolvedValue({ id: COMMAND_ID, status, error });
    publishJsonMock.mockResolvedValue(true);
};

const refreshOne = (id: string) =>
    request(app).post(`/api/v1/devices/${id}/refresh`).set("Authorization", "Bearer valid-jwt");

const refreshMany = (body?: unknown) =>
    request(app).post("/api/v1/devices/refresh").set("Authorization", "Bearer valid-jwt").send(body as object);

describe("POST /api/v1/devices/:id/refresh", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authenticate();
    });

    it("rejects a request with no bearer token", async () => {
        await request(app).post(`/api/v1/devices/${FIRST_ID}/refresh`).expect(401);

        expect(commandRepoMock.create).not.toHaveBeenCalled();
    });

    it("answers 404 for an id that is not a uuid, without touching the database", async () => {
        await refreshOne("not-a-uuid").expect(404);

        expect(repoMock.findDeviceById).not.toHaveBeenCalled();
    });

    it("asks the device to refresh and answers with its updated list row", async () => {
        const row = { id: FIRST_ID, displayName: "Pixel 8", status: "online", battery: 80 };
        repoMock.findDeviceById.mockResolvedValue(device(FIRST_ID));
        repoMock.findOverviewById.mockResolvedValue(row);
        deviceCompletes();

        const response = await refreshOne(FIRST_ID).expect(200);

        expect(response.body).toEqual(row);
        expect(commandRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({ deviceId: FIRST_ID, type: "refresh" }));
        expect(publishJsonMock).toHaveBeenCalledWith(`mdm/devices/${FIRST_ID}/commands`, expect.objectContaining({ type: "refresh" }));
        expect(repoMock.findOverviewById).toHaveBeenCalledWith(FIRST_ID);
    });

    it("answers 409 when the device is offline, without sending anything", async () => {
        repoMock.findDeviceById.mockResolvedValue(device(FIRST_ID, { online: false }));

        await refreshOne(FIRST_ID).expect(409);

        expect(commandRepoMock.create).not.toHaveBeenCalled();
        expect(publishJsonMock).not.toHaveBeenCalled();
    });

    it("answers 404 for a device that doesn't exist", async () => {
        repoMock.findDeviceById.mockResolvedValue(undefined);

        await refreshOne(FIRST_ID).expect(404);
    });

    it("answers 502 with the device's error when it reports the command failed", async () => {
        repoMock.findDeviceById.mockResolvedValue(device(FIRST_ID));
        deviceCompletes("failed", "Unknown command type: refresh");

        const response = await refreshOne(FIRST_ID).expect(502);

        expect(response.body).toMatchObject({ message: "Unknown command type: refresh", code: 502 });
        expect(repoMock.findOverviewById).not.toHaveBeenCalled();
    });

    it("answers 503 when the broker is unreachable", async () => {
        repoMock.findDeviceById.mockResolvedValue(device(FIRST_ID));
        commandRepoMock.create.mockResolvedValue(commandRow(FIRST_ID));
        publishJsonMock.mockResolvedValue(false);

        await refreshOne(FIRST_ID).expect(503);

        expect(commandRepoMock.expire).toHaveBeenCalledWith(COMMAND_ID);
    });

    it("answers 404 when the device left the list while it was answering", async () => {
        repoMock.findDeviceById.mockResolvedValue(device(FIRST_ID));
        repoMock.findOverviewById.mockResolvedValue(undefined);
        deviceCompletes();

        await refreshOne(FIRST_ID).expect(404);
    });
});

describe("POST /api/v1/devices/refresh", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authenticate();
    });

    it("rejects a request with no bearer token", async () => {
        await request(app).post("/api/v1/devices/refresh").send({ ids: [FIRST_ID] }).expect(401);

        expect(commandRepoMock.create).not.toHaveBeenCalled();
    });

    it.each([
        ["no body", undefined],
        ["no ids", {}],
        ["an empty list", { ids: [] }],
        ["an id that is not a uuid", { ids: [FIRST_ID, "nope"] }],
        ["more than 100 ids", { ids: Array.from({ length: 101 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`) }],
    ])("answers 400 for %s", async (_label, body) => {
        await refreshMany(body).expect(400);

        expect(repoMock.findDeviceById).not.toHaveBeenCalled();
    });

    it("answers 200 with one outcome per device, whatever happens to each", async () => {
        const known: Record<string, ReturnType<typeof device> | undefined> = {
            [FIRST_ID]: device(FIRST_ID),
            [SECOND_ID]: device(SECOND_ID, { online: false }),
            [THIRD_ID]: undefined,
        };
        repoMock.findDeviceById.mockImplementation(async (id: string) => known[id]);
        deviceCompletes();

        const response = await refreshMany({ ids: [FIRST_ID, SECOND_ID, THIRD_ID] }).expect(200);

        expect(response.body).toEqual({
            results: [
                { id: FIRST_ID, outcome: "refreshed" },
                { id: SECOND_ID, outcome: "offline" },
                { id: THIRD_ID, outcome: "notFound" },
            ],
        });
        expect(commandRepoMock.create).toHaveBeenCalledTimes(1);
    });

    it("reports a device that failed, or that the broker couldn't reach, as failed", async () => {
        repoMock.findDeviceById.mockImplementation(async (id: string) => device(id));
        commandRepoMock.create.mockImplementation(async (input: { deviceId: string }) => commandRow(input.deviceId));
        // The first device's command goes out and fails, the second can't be published at all.
        publishJsonMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        commandRepoMock.findById.mockResolvedValue({ id: COMMAND_ID, status: "failed", error: "boom" });

        const response = await refreshMany({ ids: [FIRST_ID, SECOND_ID] }).expect(200);

        expect(response.body.results.map((result: { outcome: string }) => result.outcome)).toEqual(["failed", "failed"]);
    });

    it("collapses duplicated ids into one refresh", async () => {
        repoMock.findDeviceById.mockResolvedValue(device(FIRST_ID));
        deviceCompletes();

        const response = await refreshMany({ ids: [FIRST_ID, FIRST_ID] }).expect(200);

        expect(response.body.results).toEqual([{ id: FIRST_ID, outcome: "refreshed" }]);
        expect(commandRepoMock.create).toHaveBeenCalledTimes(1);
    });
});
