import { randomInt } from "crypto";
import { JWTPayload } from "better-auth";
import { auth } from "@lib/auth";
import { ENV } from "@config/env";
import { db } from "@drizzle/instance";
import {
    HTTPBadRequestException,
    HTTPInternalServerErrorException,
    HTTPNotFoundException,
} from "@core/exception";

import { DeviceRepository } from "./repository";
import { EnrollDeviceInput, InventoryInput } from "./dto/schema";
import { ChallengeRepository, EnrollmentTokenRepository } from "@features/enrollement/repositories";
import { EnrollementService } from "@features/enrollement/service";
import { generateCanonicalMessage } from "@features/enrollement/utils/canonical-message";
import { verifyDeviceSignature } from "./utils/keys";

const ONE_DAY_SECONDS = 60 * 60 * 24;

// Short enrollment code: 8 chars from an unambiguous alphabet (no 0/O/1/I/L).
const ENROLL_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ENROLL_CODE_LENGTH = 8;

const ENROLL_CODE_MAX_ATTEMPTS = 6;

/** Raw, normalized code (uppercase, no separators) — stored and matched as-is. */
function generateEnrollmentCode(): string {
    let code = "";
    for (let i = 0; i < ENROLL_CODE_LENGTH; i++) {
        code += ENROLL_CODE_ALPHABET[randomInt(ENROLL_CODE_ALPHABET.length)];
    }
    return code;
}

/** Postgres unique-violation (e.g. a code/token collision). */
function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        (error as { code?: string }).code === "23505"
    );
}

export class DeviceService {
    private repository: DeviceRepository;
    private enrollementService: EnrollementService;

    constructor() {
        this.repository = new DeviceRepository();
        this.enrollementService = new EnrollementService();
    }

    /** GET /devices/enroll/challenge — issues the anti-replay nonce the agent must sign into its canonical message. */
    async issueChallenge() {
        return this.enrollementService.generateChallenge();
    }


    /**
     * Pinned-key enrollment: validates the single-use token and challenge,
     * verifies proof of possession over the canonical device-identity
     * message, pins (or checks continuity of) the device's public key, then
     * issues the long-lived device JWT (deviceToken).
     */
    async create(input: EnrollDeviceInput) {
        const device = await db.transaction(async (tx) => {
            const tokenRepo = new EnrollmentTokenRepository(tx);
            const challengeRepo = new ChallengeRepository(tx);
            const enrollementService = new EnrollementService(tokenRepo, challengeRepo);
            const deviceRepo = new DeviceRepository(tx);

            // Look up the token/challenge without consuming them yet: an
            // invalid signature is the caller's fault, so a still-valid
            // token/challenge shouldn't be burned on a failed proof-of-possession
            // attempt.
            const tokenRow = await enrollementService.assertTokenValid(input.enrollmentToken);
            await enrollementService.assertChallengeValid(input.challenge);

            const canonicalMessage = generateCanonicalMessage({
                model: input.device.model,
                manufacturer: input.device.manufacturer,
                osVersion: input.device.osVersion,
                serialNumber: input.device.serial ?? "",
                imei: input.device.imei ?? "",
                macAddress: input.device.macAddress ?? "",
                androidId: input.device.androidId ?? "",
                method: input.device.enrollementMethod ?? "",
                timestamp: input.timestamp,
                publicKey: input.device.publicKey,
                challenge: input.challenge,
            });

            const signatureValid = verifyDeviceSignature({
                publicKeyBase64: input.device.publicKey,
                signatureBase64: input.signature,
                data: canonicalMessage,
            });
            if (!signatureValid) {
                throw new HTTPBadRequestException("Invalid enrollment signature");
            }

            await tokenRepo.markConsumed(input.enrollmentToken);
            await enrollementService.consumeChallenge(input.challenge);

            // Key pinning: a re-enrollment of a known androidId must present
            // the same public key it enrolled with the first time. A mismatch
            // means the token/serial was replayed by a different device (or
            // the real device's key was rotated without admin action) — treat
            // it as a rejection rather than silently overwriting the pin.
            if (input.device.androidId) {
                const existing = await deviceRepo.findByAndroidId(input.device.androidId);
                if (existing) {
                    if (existing.publicKey !== input.device.publicKey) {
                        throw new HTTPBadRequestException(
                            "Device identity mismatch: enrolled public key does not match the previously pinned key for this device",
                        );
                    }
                    return await deviceRepo.reEnrollDevice(existing.id, {
                        enrollmentId: tokenRow.id,
                        serial: input.device.serial,
                        model: input.device.model,
                        manufacturer: input.device.manufacturer,
                        osVersion: input.device.osVersion,
                        enrollementMethod: input.device.enrollementMethod,
                        agentVersionName: input.device.agentVersionName,
                        agentVersionCode: input.device.agentVersionCode,
                        agentPackage: input.device.agentPackage,
                    });
                }
            }

            try {
                return await deviceRepo.createDevice({
                    enrollmentId: tokenRow.id,
                    serial: input.device.serial,
                    model: input.device.model,
                    manufacturer: input.device.manufacturer,
                    osVersion: input.device.osVersion,
                    status: "enrolled",
                    enrollementMethod: input.device.enrollementMethod,
                    androidId: input.device.androidId,
                    publicKey: input.device.publicKey,
                    agentVersionName: input.device.agentVersionName,
                    agentVersionCode: input.device.agentVersionCode,
                    agentPackage: input.device.agentPackage,
                });
            } catch (error) {
                if (isUniqueViolation(error)) {
                    throw new HTTPBadRequestException("Device already enrolled");
                }
                throw error;
            }
        });

        const deviceToken = await this.signDeviceJWT(device.id);

        return {
            deviceId: device.id,
            deviceToken,
        };
    }

    private async signDeviceJWT(deviceId: string) {
        const payload: JWTPayload & Required<Pick<JWTPayload, "sub" | "aud">> = {
            sub: deviceId,
            aud: ENV.BETTER_AUTH_URL,
            iss: ENV.BETTER_AUTH_URL,
            type: "device",
            exp: Math.floor(Date.now() / 1000) + 365 * ONE_DAY_SECONDS,
            iat: Math.floor(Date.now() / 1000),
        };
        const { token } = await auth.api.signJWT({ body: { payload } });
        return token;
    }

    async recordHeartbeat(deviceId: string) {
        await this.repository.touchHeartbeat(deviceId);
    }

    async recordInventory(deviceId: string, _inventory: InventoryInput) {
        // Inventory persistence (table/column) is a later chantier; for now we
        // only confirm the device is known. Heartbeat timestamp is refreshed so
        // an inventory push also counts as a check-in.
        await this.repository.touchHeartbeat(deviceId);
    }
}
