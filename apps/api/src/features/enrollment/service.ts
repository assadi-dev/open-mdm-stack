import { ENV } from "@config/env";
import { HTTPBadRequestException, HTTPNotFoundException, HTTPServiceUnavailableException } from "@core/exception";
import { generateQrSVG } from "@features/qrcode/service";
import { ChallengeRepository, OtpRepository } from "./repositories";
import { buildProvisioningPayload, generateOtpCode, generateRandomChallenge } from "./utils/generators";
import { enrollmentValidator } from "./dto/validation";
import { CreateProvisioningPayloadInput } from "./dto/schema";
import { WifiNetworkRepository } from "@features/wifi-network/repository";
import { decryptSecret } from "@lib/crypto";




/**
 * How many codes `generateOTP` draws before giving up. A draw only fails when the code is already pending, i.e. with
 * k pending codes out of 10^6 each draw collides with probability k / 10^6: needing a second draw is rare and ten
 * in a row means the code space is practically full — not something a retry fixes.
 */
const MAX_OTP_ISSUE_ATTEMPTS = 10;

export class EnrollmentService {
    challengeRepo: ChallengeRepository
    otpRepo: OtpRepository

    constructor(
        challengeRepo: ChallengeRepository = new ChallengeRepository(),
        otpRepo: OtpRepository = new OtpRepository(),
    ) {
        this.challengeRepo = challengeRepo;
        this.otpRepo = otpRepo;
    }

    /** Issues a fresh single-use code, valid for `ENROLLMENT_OTP_TTL_SECONDS`. Every call returns a different one. */
    generateOTP = async () => {
        const ttl = ENV.ENROLLMENT_OTP_TTL_SECONDS
        const expiresAt = new Date(Date.now() + ttl * 1000);

        for (let attempt = 0; attempt < MAX_OTP_ISSUE_ATTEMPTS; attempt++) {
            const code = generateOtpCode();
            // `undefined`: this code is already pending — draw another one.
            const issued = await this.otpRepo.issue({ code, expiresAt });
            if (issued) {
                return {
                    code,
                    expiresAt: expiresAt.toISOString(),
                    ttl,
                }
            }
        }
        throw new HTTPServiceUnavailableException("Could not generate a unique OTP, try again");
    }

    /**
     * Exchanges a code for an enrollment challenge. The code is consumed on the way: it works once. Unknown, expired
     * and already-used codes are indistinguishable from outside on purpose.
     */
    verifyOTP = async ({ otp, ttlSeconds }: { otp: string, ttlSeconds?: number }) => {
        const consumed = await this.otpRepo.consume(otp);
        if (!consumed) {
            throw new HTTPBadRequestException("Invalid OTP");
        }

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
        const provisioningInput = await this.resolveWifiNetwork(payload.data);


        if (format === "svg") {
            return await this.generatePayloadProvisioningToSVG(provisioningInput);
        }
        return await this.generateProvisioningPayload(provisioningInput);

    }


    private resolveWifiNetwork = async (input: CreateProvisioningPayloadInput) => {
        if (input.wifiId) {
            const wifiNetworkRepository = new WifiNetworkRepository();
            const wifiNetwork = await wifiNetworkRepository.findById(input.wifiId);

            input.wifiSsid = wifiNetwork?.ssid
            input.wifiPassword = wifiNetwork?.password ? decryptSecret(wifiNetwork?.password) : undefined
            input.wifiSecurityType = wifiNetwork?.security
        }
        return input
    }

}