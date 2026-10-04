import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// End-to-end through the real Express app (routing + validation + error
// handler all run for real); only the repository is mocked, so no real
// Postgres connection is ever opened.
const { challengeRepoMock, otpRepoMock } = vi.hoisted(() => ({
    challengeRepoMock: {
        create: vi.fn(),
        byChallenge: vi.fn(),
        markConsumed: vi.fn(),
    },
    otpRepoMock: {
        issue: vi.fn(),
        consume: vi.fn(),
    },
}));

vi.mock("@features/enrollment/repositories", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
    OtpRepository: vi.fn(function () {
        return otpRepoMock;
    }),
}));

import { app } from "../../../app";

describe("POST /api/v1/enrollment", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        challengeRepoMock.create.mockResolvedValue({ id: "challenge-row-id" });
        otpRepoMock.issue.mockResolvedValue({ id: "otp-row-id" });
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

    it("POST /display-provisioning carries the device name into the admin extras bundle", async () => {
        const res = await request(app)
            .post("/api/v1/enrollment/display-provisioning")
            .send({ name: "Tablette {n}" })
            .expect(200);

        const extras = res.body["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"];
        expect(extras.name).toBe("Tablette {n}");
    });

    it("POST /display-provisioning rejects an invalid body with a 400 instead of a raw 500", async () => {
        await request(app)
            .post("/api/v1/enrollment/display-provisioning")
            .send({ wifiSecurityType: "NOT-A-TYPE" })
            .expect(400);
    });

    it("GET /otp-generate returns a fresh 6-digit code with its real expiry", async () => {
        const res = await request(app)
            .get("/api/v1/enrollment/otp-generate")
            .expect(200);

        expect(res.body.code).toMatch(/^\d{6}$/);
        expect(typeof res.body.ttl).toBe("number");
        expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
        expect(otpRepoMock.issue).toHaveBeenCalledWith(
            expect.objectContaining({ code: res.body.code }),
        );
    });

    it("POST /otp-verify exchanges a valid code for a challenge", async () => {
        otpRepoMock.consume.mockResolvedValue({ id: "otp-row-id", consumedAt: new Date() });

        const res = await request(app)
            .post("/api/v1/enrollment/otp-verify")
            .send({ code: "123456" })
            .expect(200);

        expect(otpRepoMock.consume).toHaveBeenCalledWith("123456");
        expect(typeof res.body.challenge).toBe("string");
        expect(typeof res.body.ttlSeconds).toBe("number");
        expect(typeof res.body.expiresAt).toBe("string");
    });

    it("POST /otp-verify answers 400 \"Invalid OTP\" for a code that is unknown, expired or already used", async () => {
        otpRepoMock.consume.mockResolvedValue(undefined);

        const res = await request(app)
            .post("/api/v1/enrollment/otp-verify")
            .send({ code: "654321" })
            .expect(400);

        expect(res.body.message).toBe("Invalid OTP");
        expect(challengeRepoMock.create).not.toHaveBeenCalled();
    });

    it.each([
        ["no body", {}],
        ["a non-string code", { code: 123456 }],
        ["a code that is too short", { code: "12345" }],
        ["a code with letters", { code: "12345a" }],
    ])("POST /otp-verify rejects %s with a 400 before touching the database", async (_label, body) => {
        const res = await request(app)
            .post("/api/v1/enrollment/otp-verify")
            .send(body)
            .expect(400);

        expect(res.body.message).toBe("Validation Failed");
        expect(otpRepoMock.consume).not.toHaveBeenCalled();
    });
});
