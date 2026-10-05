import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + requireAuth
// + error handler all run for real); only the repositories and the
// better-auth JWT verification are mocked, so no real Postgres connection is
// ever opened.
const { repoMock, challengeRepoMock, authRepoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: {
        findOverviewById: vi.fn(),
        update: vi.fn(),
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

const DEVICE_ID = "7f1c2e4a-9b3d-4c5e-8f6a-1b2c3d4e5f60";

const overviewRow = (overrides: object = {}) => ({
    id: DEVICE_ID,
    name: "Tablette entrepôt 3",
    displayName: "Tablette entrepôt 3",
    serial: "R58M123",
    androidId: "934739b4e33ada2c",
    model: "Pixel 8",
    brand: "Google",
    androidVersion: "14",
    sdkVersion: 34,
    status: "online",
    ...overrides,
});

const authenticate = () => {
    verifyJWTMock.mockResolvedValue({ payload: { sub: "session-token" } });
    authRepoMock.getUserSession.mockResolvedValue({ token: "session-token", user: { id: "user-1" } });
};

const patch = (body: unknown, id = DEVICE_ID) =>
    request(app).patch(`/api/v1/devices/${id}`).set("Authorization", "Bearer valid-jwt").send(body as object);

describe("PATCH /api/v1/devices/:id", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects a request with no bearer token", async () => {
        await request(app).patch(`/api/v1/devices/${DEVICE_ID}`).send({ name: "Tablette" }).expect(401);

        expect(repoMock.update).not.toHaveBeenCalled();
    });

    it("returns a 404 for an id that isn't a UUID", async () => {
        authenticate();

        await patch({ name: "Tablette" }, "not-a-uuid").expect(404);

        expect(repoMock.update).not.toHaveBeenCalled();
    });

    it("rejects an empty body", async () => {
        authenticate();

        await patch({}).expect(400);

        expect(repoMock.update).not.toHaveBeenCalled();
    });

    it.each([
        ["a SDK version that isn't a number", { sdkVersion: "abc" }],
        ["a SDK version that isn't an integer", { sdkVersion: 34.5 }],
        ["a SDK version below 1", { sdkVersion: 0 }],
        ["a name that is too long", { name: "x".repeat(101) }],
        ["an Android ID that is too long", { androidId: "x".repeat(65) }],
    ])("rejects %s", async (_label, body) => {
        authenticate();

        await patch(body).expect(400);

        expect(repoMock.update).not.toHaveBeenCalled();
    });

    it("returns a 404 when the device doesn't exist or isn't listed", async () => {
        authenticate();
        repoMock.findOverviewById.mockResolvedValue(undefined);

        await patch({ name: "Tablette" }).expect(404);

        expect(repoMock.update).not.toHaveBeenCalled();
    });

    it("maps the fields to their columns and answers with the updated list row", async () => {
        authenticate();
        const updated = overviewRow({ name: "Tablette", displayName: "Tablette", androidVersion: "13", sdkVersion: 33 });
        repoMock.findOverviewById.mockResolvedValueOnce(overviewRow()).mockResolvedValueOnce(updated);

        const res = await patch({ name: "  Tablette  ", androidVersion: "13", sdkVersion: 33, androidId: "abc123" }).expect(200);

        expect(repoMock.update).toHaveBeenCalledWith(DEVICE_ID, {
            name: "Tablette",
            release: "13",
            sdkVersion: 33,
            androidId: "abc123",
        });
        expect(res.body).toEqual(updated);
    });

    it("clears a field sent as null or as a blank text, and leaves the others untouched", async () => {
        authenticate();
        repoMock.findOverviewById.mockResolvedValue(overviewRow());

        await patch({ name: "   ", sdkVersion: null }).expect(200);

        expect(repoMock.update).toHaveBeenCalledWith(DEVICE_ID, {
            name: null,
            release: undefined,
            sdkVersion: null,
            androidId: undefined,
        });
    });

    it("answers 409 when the Android ID belongs to another device", async () => {
        authenticate();
        repoMock.findOverviewById.mockResolvedValue(overviewRow());
        // What Drizzle throws: the Postgres error is wrapped, its SQLSTATE sits on `cause`.
        repoMock.update.mockRejectedValue(Object.assign(new Error("Failed query"), { cause: { code: "23505" } }));

        await patch({ androidId: "taken" }).expect(409);
    });
});
