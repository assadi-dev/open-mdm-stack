import { ENV } from "@config/env";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";
import { generateQrSVG } from "@features/qrcode/service";
import { ChallengeRepository } from "./repositories";
import { buildProvisioningPayload, generateRandomChallenge, OTPGenerator, OTPVerifier } from "./utils/generators";
import { enrollmentValidator } from "./dto/validation";
import { CreateProvisioningPayloadInput } from "./dto/schema";




export class EnrollmentService {
    challengeRepo: ChallengeRepository
    constructor(challengeRepo: ChallengeRepository = new ChallengeRepository()) {
        this.challengeRepo = challengeRepo;
    }

    generateOTP = async () => {
        const ttl = ENV.ENROLLMENT_OTP_TTL_SECONDS
        const { token, expiresAt } = await OTPGenerator(ttl);
        return {
            token,
            expiresAt: expiresAt.toISOString(),
            ttl,
        }
    }

    verifyOTP = async ({ otp, ttlSeconds }: { otp: string, ttlSeconds?: number }) => {
        const { valid } = await OTPVerifier(otp);
        if (!valid) {
            throw new HTTPBadRequestException("Invalid OTP");
        }

        // TODO: add consumed logic to db for otp and check otp

        return this.generateChallenge(ttlSeconds)
    }

    /** Issues a single-use, short-lived nonce for the pinned-key enrollment handshake. */
    generateChallenge = async (ttlSeconds?: number) => {
        const { challenge, ttlSeconds: resolvedTtlSeconds, expiresAt } = generateRandomChallenge(ttlSeconds ?? ENV.ENROLLMENT_CHALLENGE_TTL_SECONDS);
        await this.challengeRepo.create({ challenge, expiresAt, consumedAt: null });
        return { challenge, ttlSeconds: resolvedTtlSeconds, expiresAt: expiresAt.toISOString() };
    }

    /** Looks up a challenge and checks it's usable, without consuming it. */
    assertChallengeValid = async (challenge: string) => {
        const existing = await this.challengeRepo.byChallenge(challenge);
        if (!existing) {
            throw new HTTPNotFoundException("Challenge not found");
        }
        if (existing.consumedAt) {
            throw new HTTPBadRequestException("Challenge already consumed");
        }
        if (existing.expiresAt < new Date()) {
            throw new HTTPBadRequestException("Challenge expired");
        }
        return existing;
    }

    consumeChallenge = async (challenge: string) => {
        const row = await this.challengeRepo.markConsumed(challenge);
        return row;
    }


    async generateProvisioningPayload(input: CreateProvisioningPayloadInput) {
        const payload = buildProvisioningPayload(input);
        return payload

    }

    async generatePayloadProvisioningToSVG(input: CreateProvisioningPayloadInput) {
        const payload = buildProvisioningPayload(input);
        const svg = generateQrSVG(payload)
        return svg
    }

    async displayProvisioning({ format, body }: { format?: string, body: any }) {

        const payload = enrollmentValidator.displayEnrollmentProvisioning(body)
        if (!payload.success) {
            throw payload.error
        }

        if (format === "svg") {
            return await this.generatePayloadProvisioningToSVG(payload.data);
        }
        return await this.generateProvisioningPayload(payload.data);

    }

}