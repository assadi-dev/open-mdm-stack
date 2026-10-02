import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + requireAuth
// + error handler all run for real); only the repositories and the
// better-auth JWT verification are mocked, so no real Postgres connection is
// ever opened.
const { repoMock, challengeRepoMock, authRepoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: {
        collection: vi.fn(),
        summary: vi.fn(),
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

const authenticate = () => {
    verifyJWTMock.mockResolvedValue({ payload: { sub: "session-token" } });
    authRepoMock.getUserSession.mockResolvedValue({ token: "session-token", user: { id: "user-1" } });
};

describe("devices list routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/v1/devices", () => {
        it("rejects a request with no bearer token", async () => {
            await request(app).get("/api/v1/devices").expect(401);

            expect(repoMock.collection).not.toHaveBeenCalled();
        });

        it("rejects a sort on a column that isn't sortable", async () => {
            authenticate();

            await request(app)
                .get("/api/v1/devices?sort=publicKey")
                .set("Authorization", "Bearer valid-jwt")
                .expect(400);

            expect(repoMock.collection).not.toHaveBeenCalled();
        });

        it("rejects a status the list doesn't produce", async () => {
            authenticate();

            await request(app)
                .get("/api/v1/devices?status=compliant")
                .set("Authorization", "Bearer valid-jwt")
                .expect(400);

            expect(repoMock.collection).not.toHaveBeenCalled();
        });

        it("rejects an Android version that isn't a number", async () => {
            authenticate();

            await request(app)
                .get("/api/v1/devices?sdkVersion=abc")
                .set("Authorization", "Bearer valid-jwt")
                .expect(400);

            expect(repoMock.collection).not.toHaveBeenCalled();
        });

        it("hands the parsed query string to the repository and returns its page as is", async () => {
            authenticate();
            const page = { data: [{ id: "device-1", status: "online" }], metadata: { page: 2, limit: 50, total: 51, totalPages: 2 } };
            repoMock.collection.mockResolvedValue(page);

            const res = await request(app)
                .get("/api/v1/devices?page=2&limit=50&search=pixel&sort=-battery,model&status=offline,pending&sdkVersion=34,33")
                .set("Authorization", "Bearer valid-jwt")
                .expect(200);

            expect(repoMock.collection).toHaveBeenCalledWith({
                page: 2,
                limit: 50,
                search: "pixel",
                sort: [
                    { id: "battery", desc: true },
                    { id: "model", desc: false },
                ],
                filters: { status: ["offline", "pending"], sdkVersion: [34, 33] },
            });
            expect(res.body).toEqual(page);
        });
    });

    describe("GET /api/v1/devices/summary", () => {
        it("rejects a request with no bearer token", async () => {
            await request(app).get("/api/v1/devices/summary").expect(401);

            expect(repoMock.summary).not.toHaveBeenCalled();
        });

        it("returns the counts per status and per Android version", async () => {
            authenticate();
            repoMock.summary.mockResolvedValue({
                byStatus: [{ status: "offline", count: 4 }],
                androidVersions: [{ sdkVersion: 34, androidVersion: "14", count: 4 }],
            });

            const res = await request(app)
                .get("/api/v1/devices/summary")
                .set("Authorization", "Bearer valid-jwt")
                .expect(200);

            expect(res.body).toEqual({
                total: 4,
                byStatus: { pending: 0, offline: 4, commandRunning: 0, online: 0 },
                androidVersions: [{ sdkVersion: 34, androidVersion: "14", count: 4 }],
            });
        });
    });
});
