import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + error
// handler all run for real); only the repository is mocked, so no real
// Postgres connection is ever opened.
const { repoMock } = vi.hoisted(() => ({
    repoMock: {
        create: vi.fn(),
        getOne: vi.fn(),
        byToken: vi.fn(),
        markConsumed: vi.fn(),
        markUnused: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("@features/enrollement/repositories", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    EnrollmentTokenRepository: vi.fn(function () {
        return repoMock;
    }),
}));

import { app } from "../../../app";

describe("POST /api/v1/enrollement", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("POST /token issues a single-use enrollment token without touching a real database", async () => {
        repoMock.create.mockResolvedValue({ id: "row-id" });

        const res = await request(app)
            .post("/api/v1/enrollement/token")
            .send({ ttlSeconds: 120 })
            .expect(200);

        expect(res.body.ttlSeconds).toBe(120);
        expect(typeof res.body.token).toBe("string");
        expect(repoMock.create).toHaveBeenCalledTimes(1);
    });

    it("POST /provisioning?format=svg returns an SVG QR code of the provisioning payload", async () => {
        const res = await request(app)
            .post("/api/v1/enrollement/provisioning?format=svg")
            .send({})
            .expect(200);

        // superagent doesn't have a built-in text parser for image/svg+xml, so
        // the body arrives as a raw Buffer rather than populating `res.text`.
        expect(res.headers["content-type"]).toContain("image/svg+xml");
        expect(Buffer.from(res.body).toString("utf8")).toContain("<svg");
    });

    it("POST /provisioning returns the raw Device Owner provisioning payload as JSON", async () => {
        const res = await request(app)
            .post("/api/v1/enrollement/provisioning")
            .send({ policyId: "policy-1" })
            .expect(200);

        const extras = res.body["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"];
        expect(extras.policyId).toBe("policy-1");
    });
});
