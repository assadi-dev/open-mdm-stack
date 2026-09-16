import { ENV } from "@config/env";
import { HTTPBadRequestException, HTTPNotFoundException } from "@core/exception";
import { CreateTokenInput, CreateEnrollmentTokenInput } from "@features/device/dto/schema";
import { generateQrSVG } from "@features/qrcode/service";
import { randomBytes } from "crypto";
import { EnrollmentTokenRepository } from "./repositories";
import { db } from "@drizzle/instance";
import { enrollmentTokens } from "@drizzle/schemas/device-schema";
import { InsertEnrollmentTokenDto } from "./dto/schema";


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



export class EnrollementService {
    enrollmenentRepo: EnrollmentTokenRepository
    constructor() {
        this.enrollmenentRepo = new EnrollmentTokenRepository();
    }





    /**
     * 
     * provisioning QR (PNG) and returns the row + QR filename.
     */
    async generateQrProvisioning(input: CreateEnrollmentTokenInput) {

        const payload = this.buildProvisioningPayload(input);
        const svg = generateQrSVG(payload)
        return svg
    }

    /**
     * Generate a random token
     */
    async generateToken(input: CreateTokenInput) {
        const token = randomBytes(32).toString("base64url");
        const ttlSeconds = input.ttlSeconds ?? ENV.ENROLLMENT_TOKEN_TTL_SECONDS
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

        //TODO : store in database
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


    /** Android Device Owner provisioning extras, encoded into the QR. */
    buildProvisioningPayload(input: CreateEnrollmentTokenInput) {
        const payload: Record<string, unknown> = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": ENV.MDM_PACKAGE_NAME,
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": ENV.MDM_DPC_COMPONENT,
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": input.checksum ?? ENV.MDM_DPC_SIGNATURE_CHECKSUM,
            "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
                deviceSecret: ENV.MDM_DEVICE_SECRET,
                serverBaseUrl: ENV.MDM_PUBLIC_BASE_URL,
                ...(input.policyId ? { policyId: input.policyId } : {}),
                ...(input.groupId ? { groupId: input.groupId } : {}),
            },

        };
        if (input.skipEncryption) {
            payload["android.app.extra.PROVISIONING_SKIP_ENCRYPTION"] = input.skipEncryption;
        }
        if (input?.systemApps) {
            payload["android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED"] = input?.systemApps
        }

        if (input?.apkUrl) {
            payload["android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION"] = input.apkUrl;
        }
        if (input?.wifiSsid) {
            const securityType = WIFI_SECURITY_TYPE_MAP[input.wifiSecurityType ?? "WPA2"] ?? "WPA";
            payload["android.app.extra.PROVISIONING_WIFI_SSID"] = input.wifiSsid;
            payload["android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE"] = securityType;
            if (securityType !== "NONE" && input.wifiPassword) {
                payload["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = input.wifiPassword;
            }
            if (input.wifiHidden) {
                payload["android.app.extra.PROVISIONING_WIFI_HIDDEN"] = input.wifiHidden;
            }
        }
        return payload;
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



}