import { randomBytes, randomInt } from "crypto";
import { JWTPayload } from "better-auth";
import { auth } from "@lib/auth";
import { ENV } from "@config/env";
import {
    HTTPBadRequestException,
    HTTPInternalServerErrorException,
    HTTPNotFoundException,
} from "@core/exception";
import { generateQR } from "@features/qrcode/service";
import { DeviceRepository } from "./repository";
import { CreateEnrollmentTokenInput, EnrollDeviceInput, InventoryInput } from "./dto/schema";

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

/**
 * Android provisioning only accepts NONE | WPA | WEP | EAP for
 * PROVISIONING_WIFI_SECURITY_TYPE. WPA2/WPA3 (PSK family) are declared as "WPA".
 */
const WIFI_SECURITY_TYPE_MAP: Record<string, "NONE" | "WPA" | "WEP" | "EAP"> = {
    NONE: "NONE",
    WEP: "WEP",
    WPA: "WPA",
    WPA2: "WPA",
    WPA3: "WPA",
    EAP: "EAP",
};

export class DeviceService {
    private repository: DeviceRepository;

    constructor() {
        this.repository = new DeviceRepository();
    }

    /**
     * Creates a single-use enrollment token, renders the Device Owner
     * provisioning QR (PNG) and returns the row + QR filename.
     */
    async generateEnrollmentToken(input: CreateEnrollmentTokenInput, createdBy?: string | null) {
        const token = randomBytes(32).toString("base64url");
        const ttlMinutes = input.expiresInMinutes ?? ENV.ENROLLMENT_TOKEN_TTL_MINUTES;
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        const payload = this.buildProvisioningPayload(token, input);
        const qrFileName = await generateQR(JSON.stringify(payload));

        const row = await this.insertWithUniqueCode({ token, expiresAt, createdBy, qrFileName });

        return {
            id: row.id,
            token: row.token,
            code: row.code ?? "",
            expiresAt: row.expiresAt,
            qrFileName: row.qrFileName,
            provisioning: payload,
        };
    }

    /**
     * Inserts the token row, regenerating the short code on a unique-violation
     * (rare collision) until it succeeds or the attempt budget runs out.
     */
    private async insertWithUniqueCode(base: {
        token: string;
        expiresAt: Date;
        createdBy?: string | null;
        qrFileName?: string | null;
    }) {
        for (let attempt = 1; attempt <= ENROLL_CODE_MAX_ATTEMPTS; attempt++) {
            try {
                return await this.repository.createToken({
                    ...base,
                    code: generateEnrollmentCode(),
                });
            } catch (error) {
                if (isUniqueViolation(error) && attempt < ENROLL_CODE_MAX_ATTEMPTS) continue;
                throw error;
            }
        }
        throw new HTTPInternalServerErrorException("could not allocate a unique enrollment code");
    }

    /** Android Device Owner provisioning extras, encoded into the QR. */
    buildProvisioningPayload(token: string, input?: CreateEnrollmentTokenInput) {
        const payload: Record<string, unknown> = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": ENV.MDM_DPC_COMPONENT,
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": ENV.MDM_APK_URL,
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM":
                ENV.MDM_DPC_SIGNATURE_CHECKSUM,
            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
                enrollmentToken: token,
                serverBaseUrl: ENV.MDM_PUBLIC_BASE_URL,
            },
            "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false,
        };
        if (input?.wifiSsid) {
            const securityType = WIFI_SECURITY_TYPE_MAP[input.wifiSecurityType ?? "WPA2"] ?? "WPA";
            payload["android.app.extra.PROVISIONING_WIFI_SSID"] = input.wifiSsid;
            payload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = securityType;
            if (securityType !== "NONE" && input.wifiPassword) {
                payload["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = input.wifiPassword;
            }
            if (input.wifiHidden) {
                payload["android.app.extra.PROVISIONING_WIFI_HIDDEN"] = true;
            }
        }
        return payload;
    }

    async getTokenById(id: string) {
        const row = await this.repository.findTokenById(id);
        if (!row) {
            throw new HTTPNotFoundException("enrollment token not found");
        }
        return row;
    }

    /**
     * Consumes an enrollment token: validates it, creates the device, marks the
     * token used and issues the long-lived device JWT (deviceToken).
     */
    async enrollDevice(input: EnrollDeviceInput) {
        const tokenRow = await this.repository.findUsableToken(input.enrollmentToken);
        if (!tokenRow) {
            throw new HTTPBadRequestException("invalid, used or expired enrollment token");
        }

        const device = await this.repository.createDevice({
            enrollmentTokenId: tokenRow.id,
            serial: input.device.serial,
            model: input.device.model,
            manufacturer: input.device.manufacturer,
            osVersion: input.device.osVersion,
        });

        await this.repository.markTokenUsed(tokenRow.id, device.id);

        const deviceToken = await this.signDeviceJWT(device.id);
        return { deviceId: device.id, deviceToken };
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
