import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + requireAuth
// + error handler all run for real); only the repositories and the
// better-auth JWT verification are mocked, so no real Postgres connection is
// ever opened.
const { repoMock, challengeRepoMock, authRepoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: {
        unenroll: vi.fn(),
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

const remove = (body?: unknown) =>
    request(app).delete("/api/v1/devices").set("Authorization", "Bearer valid-jwt").send(body as object);

describe("DELETE /api/v1/devices", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects a request with no bearer token", async () => {
        await request(app).delete("/api/v1/devices").send({ ids: [FIRST_ID] }).expect(401);

        expect(repoMock.unenroll).not.toHaveBeenCalled();
    });

    it.each([
        ["no body", undefined],
        ["no ids", {}],
        ["an empty list of ids", { ids: [] }],
        ["an id that isn't a UUID", { ids: ["not-a-uuid"] }],
        ["more ids than a page can hold", { ids: Array.from({ length: 101 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`) }],
    ])("rejects %s", async (_label, body) => {
        authenticate();

        await remove(body).expect(400);

        expect(repoMock.unenroll).not.toHaveBeenCalled();
    });

    it("unenrolls a single device sent as a list of one id, answering 204 with no body", async () => {
        authenticate();

        const res = await remove({ ids: [FIRST_ID] }).expect(204);

        expect(repoMock.unenroll).toHaveBeenCalledWith([FIRST_ID]);
        expect(res.body).toEqual({});
    });

    it("unenrolls several devices at once, collapsing duplicated ids", async () => {
        authenticate();

        await remove({ ids: [FIRST_ID, SECOND_ID, FIRST_ID] }).expect(204);

        expect(repoMock.unenroll).toHaveBeenCalledTimes(1);
        expect(repoMock.unenroll).toHaveBeenCalledWith([FIRST_ID, SECOND_ID]);
    });
});
