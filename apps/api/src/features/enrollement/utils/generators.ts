import { randomBytes } from "crypto";
import { CreateEnrollmentTokenInput, CreateTokenInput } from "../dto/schema";
import { ENV } from "@config/env";
import { generateSecret, generate, verify, generateURI } from "otplib";



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




export const generateRandomToken = (inputs: CreateTokenInput) => {
    const token = randomBytes(32).toString("base64url");
    const ttlSeconds = inputs.ttlSeconds ?? ENV.ENROLLMENT_TOKEN_TTL_SECONDS
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    return {
        token,
        ttlSeconds,
        expiresAt,
    }

}





/** Android Device Owner provisioning extras, encoded into the QR. */
export const buildProvisioningPayload = (input: CreateEnrollmentTokenInput) => {

    const payload: Record<string, unknown> = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": ENV.MDM_PACKAGE_NAME,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": ENV.MDM_DPC_COMPONENT,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": input.checksum ?? ENV.MDM_DPC_SIGNATURE_CHECKSUM,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            token: input.token,
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



export const OTPGenerator = async (ttl: number = 600) => {
    // Generate a secret
    const secret = ENV.MDM_OTP_SECRET;
    // Generate a TOTP token
    const token = await generate({ secret });
    const expiresAt = new Date(Date.now() + ttl * 1000);


    return {
        token,
        ttl,
        expiresAt,
    }

}


export const OTPVerifier = async (otp: string) => {
    const secret = ENV.MDM_OTP_SECRET;
    return verify({ token: otp, secret });
}