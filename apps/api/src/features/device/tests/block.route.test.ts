import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + requireAuth
// + error handler all run for real); only the repositories and the
// better-auth JWT verification are mocked, so no real Postgres connection is
// ever opened.
const { repoMock, challengeRepoMock, authRepoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: {
        findOverviewById: vi.fn(),
        block: vi.fn(),
    },
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

const authenticate = () => {
    verifyJWTMock.mockResolvedValue({ payload: { sub: "session-token" } });
    authRepoMock.getUserSession.mockResolvedValue({ token: "session-token", user: { id: "user-1" } });
};

const blockOne = (id: string) =>
    request(app).post(`/api/v1/devices/${id}/block`).set("Authorization", "Bearer valid-jwt");

const blockMany = (body?: unknown) =>
    request(app).post("/api/v1/devices/block").set("Authorization", "Bearer valid-jwt").send(body as object);

describe("POST /api/v1/devices/:id/block", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authenticate();
    });

    it("rejects a request with no bearer token", async () => {
        await request(app).post(`/api/v1/devices/${FIRST_ID}/block`).expect(401);

        expect(repoMock.block).not.toHaveBeenCalled();
    });

    it("answers 404 for an id that is not a uuid, without touching the database", async () => {
        await blockOne("not-a-uuid").expect(404);

        expect(repoMock.findOverviewById).not.toHaveBeenCalled();
    });

    it("answers 404 for a device that doesn't exist, without blocking anything", async () => {
        repoMock.findOverviewById.mockResolvedValue(undefined);

        await blockOne(FIRST_ID).expect(404);

        expect(repoMock.block).not.toHaveBeenCalled();
    });

    it("blocks the device and answers with its updated list row", async () => {
        const row = { id: FIRST_ID, displayName: "Pixel 8", status: "online", blockedAt: "2026-10-05T10:00:00.000Z" };
        repoMock.findOverviewById.mockResolvedValueOnce({ ...row, blockedAt: null }).mockResolvedValueOnce(row);

        const response = await blockOne(FIRST_ID).expect(200);

        expect(repoMock.block).toHaveBeenCalledWith([FIRST_ID]);
        expect(response.body).toEqual(row);
    });
});

describe("POST /api/v1/devices/block", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        authenticate();
    });

    it("rejects a request with no bearer token", async () => {
        await request(app).post("/api/v1/devices/block").send({ ids: [FIRST_ID] }).expect(401);

        expect(repoMock.block).not.toHaveBeenCalled();
    });

    it.each([
        ["no body", undefined],
        ["no ids", {}],
        ["an empty list", { ids: [] }],
        ["an id that is not a uuid", { ids: [FIRST_ID, "nope"] }],
    ])("answers 400 for %s", async (_label, body) => {
        await blockMany(body).expect(400);

        expect(repoMock.block).not.toHaveBeenCalled();
    });

    it("blocks several devices at once, collapsing duplicated ids, answering 204 with no body", async () => {
        const res = await blockMany({ ids: [FIRST_ID, SECOND_ID, FIRST_ID] }).expect(204);

        expect(repoMock.block).toHaveBeenCalledTimes(1);
        expect(repoMock.block).toHaveBeenCalledWith([FIRST_ID, SECOND_ID]);
        expect(res.body).toEqual({});
    });
});
