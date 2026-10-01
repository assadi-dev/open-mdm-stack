import { randomBytes } from "crypto";
import { CreateProvisioningPayloadInput } from "../dto/schema";
import { ENV } from "@config/env";
import { OTP } from "otplib";

const OTP_CONFIG = { strategy: "totp", digits: 6, secret: ENV.MDM_OTP_SECRET } as {
    strategy: "hotp" | "totp";
    digits: number;
    secret: string;
};




/**
 * Android provisioning only accepts NONE | WPA | WEP | EAP for
 * PROVISIONING_WIFI_SECURITY_TYPE. WPA2/WPA3 (PSK family) are declared as "WPA".
 */
export const WIFI_SECURITY_TYPE_MAP: Record<string, "NONE" | "WPA" | "WEP" | "EAP"> = {
    NONE: "NONE",
    WEP: "WEP",
    WPA: "WPA",
    WPA2: "WPA",
    WPA3: "WPA",
    EAP: "EAP",
};




/** Anti-replay nonce for the pinned-key enrollment handshake (single-use, short TTL). */
export const generateRandomChallenge = (ttlSeconds: number = ENV.ENROLLMENT_CHALLENGE_TTL_SECONDS) => {
    const challenge = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    return {
        challenge,
        ttlSeconds,
        expiresAt,
    }
}





/** Android Device Owner provisioning extras, encoded into the QR. */
export const buildProvisioningPayload = (input: CreateProvisioningPayloadInput) => {

    const payload: Record<string, unknown> = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": ENV.MDM_PACKAGE_NAME,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": ENV.MDM_DPC_COMPONENT,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": input.checksum ?? ENV.MDM_DPC_SIGNATURE_CHECKSUM,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            serverBaseUrl: ENV.MDM_SERVER_BASE_URL,
            ...(input.policyId ? { policyId: input.policyId } : {}),
            ...(input.groupId ? { groupId: input.groupId } : {}),
        },
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": input.skipEncryption,
    };

    if (input?.systemApps) {
        payload["android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED"] = input?.systemApps
    }

    if (input?.apkUrl) {
        payload["android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION"] = input.apkUrl ?? ENV.MDM_APK_URL;
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



export const OTPGenerator = async (ttl: number = 300) => {
    const otp = new OTP({ strategy: OTP_CONFIG.strategy, });
    // Generate a secret
    const secret = OTP_CONFIG.secret;
    // Generate a TOTP token
    const token = await otp.generate({ secret, period: ttl, digits: OTP_CONFIG.digits });
    const expiresAt = new Date(Date.now() + ttl * 1000);


    return {
        token,
        ttl,
        expiresAt,
    }

}


export const OTPVerifier = async (token: string, ttl: number = 300) => {
    const otp = new OTP({ strategy: OTP_CONFIG.strategy, });

    const secret = OTP_CONFIG.secret;
    const result = await otp.verify({ token, secret, digits: OTP_CONFIG.digits, period: ttl });
    return result

}