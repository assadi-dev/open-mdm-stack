import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + requireAuth
// + error handler all run for real); only the repositories and the
// better-auth JWT verification are mocked, so no real Postgres connection is
// ever opened.
const { repoMock, authRepoMock, verifyJWTMock } = vi.hoisted(() => ({
    repoMock: {
        create: vi.fn(),
        findAll: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    authRepoMock: {
        getUserSession: vi.fn(),
    },
    verifyJWTMock: vi.fn(),
}));

vi.mock("@features/wifi-network/repository", () => ({
    WifiNetworkRepository: vi.fn(function () {
        return repoMock;
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

const NETWORK_ID = "7f1c2e4a-9b3d-4c5e-8f6a-1b2c3d4e5f60";

const wifiNetworkRow = (overrides: object = {}) => ({
    id: NETWORK_ID,
    name: "Office",
    ssid: "office-ssid",
    password: "s3cr3t!",
    security: "WPA2",
    createdAt: "2026-09-23T10:00:00.000Z",
    updatedAt: "2026-09-23T10:00:00.000Z",
    ...overrides,
});

const authenticate = () => {
    verifyJWTMock.mockResolvedValue({ payload: { sub: "session-token" } });
    authRepoMock.getUserSession.mockResolvedValue({ token: "session-token", user: { id: "user-1" } });
};

describe("wifi-network routes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("POST /api/v1/wifi-networks", () => {
        it("rejects a request with no bearer token", async () => {
            await request(app)
                .post("/api/v1/wifi-networks")
                .send({ ssid: "office-ssid", password: "s3cr3t!", security: "WPA2" })
                .expect(401);

            expect(repoMock.create).not.toHaveBeenCalled();
        });

        it("rejects a body missing a required field", async () => {
            authenticate();

            await request(app)
                .post("/api/v1/wifi-networks")
                .set("Authorization", "Bearer valid-jwt")
                .send({ ssid: "office-ssid" })
                .expect(400);

            expect(repoMock.create).not.toHaveBeenCalled();
        });

        it("creates a wifi network without a name", async () => {
            authenticate();
            repoMock.create.mockResolvedValue(wifiNetworkRow({ name: undefined }));

            const res = await request(app)
                .post("/api/v1/wifi-networks")
                .set("Authorization", "Bearer valid-jwt")
                .send({ ssid: "office-ssid", password: "s3cr3t!", security: "WPA2" })
                .expect(201);

            expect(repoMock.create).toHaveBeenCalledWith({
                ssid: "office-ssid",
                password: "s3cr3t!",
                security: "WPA2",
            });
            expect(res.body.ssid).toBe("office-ssid");
        });
    });

    describe("GET /api/v1/wifi-networks", () => {
        it("rejects a request with no bearer token", async () => {
            await request(app).get("/api/v1/wifi-networks").expect(401);
        });

        it("lists every wifi network", async () => {
            authenticate();
            repoMock.findAll.mockResolvedValue([wifiNetworkRow()]);

            const res = await request(app)
                .get("/api/v1/wifi-networks")
                .set("Authorization", "Bearer valid-jwt")
                .expect(200);

            expect(res.body).toEqual([wifiNetworkRow()]);
        });
    });

    describe("GET /api/v1/wifi-networks/:id", () => {
        it("returns a 404 for an id that isn't a UUID", async () => {
            authenticate();

            await request(app)
                .get("/api/v1/wifi-networks/not-a-uuid")
                .set("Authorization", "Bearer valid-jwt")
                .expect(404);

            expect(repoMock.findById).not.toHaveBeenCalled();
        });

        it("returns a 404 when the wifi network doesn't exist", async () => {
            authenticate();
            repoMock.findById.mockResolvedValue(undefined);

            await request(app)
                .get(`/api/v1/wifi-networks/${NETWORK_ID}`)
                .set("Authorization", "Bearer valid-jwt")
                .expect(404);
        });

        it("returns the wifi network", async () => {
            authenticate();
            repoMock.findById.mockResolvedValue(wifiNetworkRow());

            const res = await request(app)
                .get(`/api/v1/wifi-networks/${NETWORK_ID}`)
                .set("Authorization", "Bearer valid-jwt")
                .expect(200);

            expect(res.body).toEqual(wifiNetworkRow());
        });
    });

    describe("PATCH /api/v1/wifi-networks/:id", () => {
        it("rejects an empty patch body", async () => {
            authenticate();
            repoMock.findById.mockResolvedValue(wifiNetworkRow());

            await request(app)
                .patch(`/api/v1/wifi-networks/${NETWORK_ID}`)
                .set("Authorization", "Bearer valid-jwt")
                .send({})
                .expect(400);

            expect(repoMock.update).not.toHaveBeenCalled();
        });

        it("returns a 404 when the wifi network doesn't exist", async () => {
            authenticate();
            repoMock.findById.mockResolvedValue(undefined);

            await request(app)
                .patch(`/api/v1/wifi-networks/${NETWORK_ID}`)
                .set("Authorization", "Bearer valid-jwt")
                .send({ ssid: "new-ssid" })
                .expect(404);

            expect(repoMock.update).not.toHaveBeenCalled();
        });

        it("updates the wifi network", async () => {
            authenticate();
            repoMock.findById.mockResolvedValue(wifiNetworkRow());
            repoMock.update.mockResolvedValue(wifiNetworkRow({ ssid: "new-ssid" }));

            const res = await request(app)
                .patch(`/api/v1/wifi-networks/${NETWORK_ID}`)
                .set("Authorization", "Bearer valid-jwt")
                .send({ ssid: "new-ssid" })
                .expect(200);

            expect(repoMock.update).toHaveBeenCalledWith(NETWORK_ID, { ssid: "new-ssid" });
            expect(res.body.ssid).toBe("new-ssid");
        });
    });

    describe("DELETE /api/v1/wifi-networks/:id", () => {
        it("returns a 404 when the wifi network doesn't exist", async () => {
            authenticate();
            repoMock.delete.mockResolvedValue(undefined);

            await request(app)
                .delete(`/api/v1/wifi-networks/${NETWORK_ID}`)
                .set("Authorization", "Bearer valid-jwt")
                .expect(404);
        });

        it("deletes the wifi network", async () => {
            authenticate();
            repoMock.delete.mockResolvedValue(wifiNetworkRow());

            await request(app)
                .delete(`/api/v1/wifi-networks/${NETWORK_ID}`)
                .set("Authorization", "Bearer valid-jwt")
                .expect(204);
        });
    });
});
