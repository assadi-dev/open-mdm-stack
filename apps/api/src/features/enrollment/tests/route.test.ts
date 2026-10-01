import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + error
// handler all run for real); only the repository is mocked, so no real
// Postgres connection is ever opened.
const { challengeRepoMock } = vi.hoisted(() => ({
    challengeRepoMock: {
        create: vi.fn(),
        byChallenge: vi.fn(),
        markConsumed: vi.fn(),
    },
}));

vi.mock("@features/enrollment/repositories", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
}));

import { app } from "../../../app";

describe("POST /api/v1/enrollment", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        challengeRepoMock.create.mockResolvedValue({ id: "challenge-row-id" });
    });

    it("GET /challenge issues a single-use anti-replay challenge without touching a real database", async () => {
        const res = await request(app)
            .get("/api/v1/enrollment/challenge")
            .expect(200);

        expect(typeof res.body.challenge).toBe("string");
        expect(res.body.challenge.length).toBeGreaterThan(0);
        expect(challengeRepoMock.create).toHaveBeenCalledTimes(1);
    });

    it("POST /display-provisioning?format=svg returns an SVG QR code of the provisioning payload", async () => {
        const res = await request(app)
            .post("/api/v1/enrollment/display-provisioning?format=svg")
            .send({})
            .expect(200);

        // superagent doesn't have a built-in text parser for image/svg+xml, so
        // the body arrives as a raw Buffer rather than populating `res.text`.
        expect(res.headers["content-type"]).toContain("image/svg+xml");
        expect(Buffer.from(res.body).toString("utf8")).toContain("<svg");
    });

    it("POST /display-provisioning returns the raw Device Owner provisioning payload without minting a challenge", async () => {
        const res = await request(app)
            .post("/api/v1/enrollment/display-provisioning")
            .send({ policyId: "policy-1" })
            .expect(200);

        const extras = res.body["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"];
        expect(typeof extras.serverBaseUrl).toBe("string");
        expect(extras).not.toHaveProperty("challenge");
        expect(extras.policyId).toBe("policy-1");
        expect(challengeRepoMock.create).not.toHaveBeenCalled();
    });

    it("POST /display-provisioning rejects an invalid body with a 400 instead of a raw 500", async () => {
        await request(app)
            .post("/api/v1/enrollment/display-provisioning")
            .send({ wifiSecurityType: "NOT-A-TYPE" })
            .expect(400);
    });
});
