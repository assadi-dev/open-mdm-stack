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
        repoMock.create.mockResolvedValue({ id: "row-id" });
    });

    it("GET /token-generate issues a single-use enrollment token without touching a real database", async () => {
        const res = await request(app)
            .get("/api/v1/enrollement/token-generate")
            .send({ ttlSeconds: 120 })
            .expect(200);

        expect(res.body.ttlSeconds).toBe(120);
        expect(typeof res.body.token).toBe("string");
        expect(repoMock.create).toHaveBeenCalledTimes(1);
    });

    it("POST /display-provisioning?format=svg returns an SVG QR code embedding a freshly generated token", async () => {
        const res = await request(app)
            .post("/api/v1/enrollement/display-provisioning?format=svg")
            .send({})
            .expect(200);

        // superagent doesn't have a built-in text parser for image/svg+xml, so
        // the body arrives as a raw Buffer rather than populating `res.text`.
        expect(res.headers["content-type"]).toContain("image/svg+xml");
        expect(Buffer.from(res.body).toString("utf8")).toContain("<svg");
    });

    it("POST /display-provisioning returns the raw Device Owner provisioning payload, carrying a freshly generated token", async () => {
        const res = await request(app)
            .post("/api/v1/enrollement/display-provisioning")
            .send({ policyId: "policy-1" })
            .expect(200);

        const extras = res.body["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"];
        expect(typeof extras.token).toBe("string");
        expect(extras.token.length).toBeGreaterThan(0);
        expect(extras.policyId).toBe("policy-1");
    });

    // Regression test for the crash reported in prod logs: POST /display-provisioning
    // with no ?ttlSeconds= used to throw "RangeError: Invalid time value" —
    // Number(undefined) is NaN, which `??` doesn't catch, so an Invalid Date
    // reached the DB insert. Fixed by resolving the fallback before coercing.
    it("POST /display-provisioning without a ttlSeconds query param falls back to the configured TTL instead of crashing", async () => {
        await request(app)
            .post("/api/v1/enrollement/display-provisioning")
            .send({})
            .expect(200);

        expect(repoMock.create).toHaveBeenCalledTimes(1);
        const [insertedRow] = repoMock.create.mock.calls[0];
        expect(insertedRow.expiresAt).toBeInstanceOf(Date);
        expect(Number.isNaN(insertedRow.expiresAt.getTime())).toBe(false);
    });

    it("POST /display-provisioning rejects an invalid body with a 400 instead of a raw 500", async () => {
        await request(app)
            .post("/api/v1/enrollement/display-provisioning")
            .send({ wifiSecurityType: "NOT-A-TYPE" })
            .expect(400);
    });
});
