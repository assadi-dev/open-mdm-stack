import { ENV } from "@config/env";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";
import { CreateTokenInput, CreateEnrollmentTokenInput } from "@features/device/dto/schema";
import { generateQrSVG } from "@features/qrcode/service";
import { EnrollmentTokenRepository } from "./repositories";
import { buildProvisioningPayload, generateRandomToken, OTPGenerator, OTPVerifier } from "./utils/generators";
import { enrollementValidator } from "./dto/validation";




export class EnrollementService {
    enrollmenentRepo: EnrollmentTokenRepository
    constructor() {
        this.enrollmenentRepo = new EnrollmentTokenRepository();
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


    consumeToken = async (token: string) => {
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
        const row = await this.enrollmenentRepo.markConsumed(token);
        return row
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