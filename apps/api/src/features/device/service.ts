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
import { EnrollmentTokenRepository } from "@features/enrollement/repositories";
import { EnrollementService } from "@features/enrollement/service";

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

    constructor() {
        this.repository = new DeviceRepository();
    }





    /**
     * Consumes an enrollment token: validates it, creates the device, marks the
     * token used and issues the long-lived device JWT (deviceToken).
     */
    async create(input: EnrollDeviceInput) {
        const device = await db.transaction(async (tx) => {
            const enrollementService = new EnrollementService(new EnrollmentTokenRepository(tx));
            const consumedToken = await enrollementService.consumeToken(input.enrollmentToken);

            try {
                return await new DeviceRepository(tx).createDevice({
                    enrollmentId: consumedToken.id,
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
