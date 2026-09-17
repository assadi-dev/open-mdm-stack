import { ENV } from "@config/env";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";
import { generateQrSVG } from "@features/qrcode/service";
import { ChallengeRepository, EnrollmentTokenRepository } from "./repositories";
import { buildProvisioningPayload, generateRandomChallenge, generateRandomToken, OTPGenerator, OTPVerifier } from "./utils/generators";
import { enrollementValidator } from "./dto/validation";
import { CreateEnrollmentTokenInput, CreateTokenInput } from "./dto/schema";




export class EnrollementService {
    enrollmenentRepo: EnrollmentTokenRepository
    challengeRepo: ChallengeRepository
    constructor(
        enrollmentTokenRepo: EnrollmentTokenRepository = new EnrollmentTokenRepository(),
        challengeRepo: ChallengeRepository = new ChallengeRepository(),
    ) {
        this.enrollmenentRepo = enrollmentTokenRepo;
        this.challengeRepo = challengeRepo;
    }


    /**
   * Generate a random token
   */
    async generateToken(input?: CreateTokenInput) {
        const { token, ttlSeconds, expiresAt } = generateRandomToken(input);
        await this.enrollmenentRepo.create({
            token,
            expiresAt,
            consumedAt: null,
        });

        return {
            token,
            expiresAt: expiresAt.toISOString(),
            ttlSeconds,
        };
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

        return this.generateToken({ ttlSeconds })
    }


    /** Looks up a token and checks it's usable, without consuming it. */
    assertTokenValid = async (token: string) => {
        const existing = await this.enrollmenentRepo.byToken(token);
        if (!existing) {
            throw new HTTPNotFoundException("Token not found");
        }
        if (existing.consumedAt) {
            throw new HTTPBadRequestException("Token already consumed");
        }
        if (existing.expiresAt < new Date()) {
            throw new HTTPBadRequestException("Token expired");
        }
        return existing;
    }

    consumeToken = async (token: string) => {
        await this.assertTokenValid(token);
        const row = await this.enrollmenentRepo.markConsumed(token);
        return row
    }

    /** Issues a single-use, short-lived nonce for the pinned-key enrollment handshake. */
    generateChallenge = async () => {
        const { challenge, ttlSeconds, expiresAt } = generateRandomChallenge();
        await this.challengeRepo.create({ challenge, expiresAt, consumedAt: null });
        return { challenge, ttlSeconds, expiresAt: expiresAt.toISOString() };
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


    async generateProvisioningPayload(input: CreateEnrollmentTokenInput) {
        const payload = buildProvisioningPayload(input);
        return payload

    }

    async generatePayloadProvisioningToSVG(input: CreateEnrollmentTokenInput) {
        const payload = buildProvisioningPayload(input);
        const svg = generateQrSVG(payload)
        return svg
    }

    async displayProvisioning({ format, ttlSeconds, body }: { format?: string, ttlSeconds?: number, body: any }) {

        const { token } = await this.generateToken({ ttlSeconds });

        const payload = enrollementValidator.displayEnrollmentProvisioning({
            ...body,
            token
        })
        if (!payload.success) {
            throw payload.error
        }

        if (format === "svg") {
            return await this.generatePayloadProvisioningToSVG(payload.data);
        }
        return await this.generateProvisioningPayload(payload.data);

    }

}