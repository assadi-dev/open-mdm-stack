/**
 * Simulates a fictional Android device going through the pinned-key
 * enrollment flow against a running dev server: obtain a token, fetch an
 * anti-replay challenge, sign the canonical identity message with a mock
 * Keystore key pair (proof of possession), enroll, then send one heartbeat
 * with the issued device JWT.
 *
 * Usage:
 *   npx tsx scripts/mock-device-enroll.ts
 *   MOCK_BASE_URL=http://localhost:5573 npx tsx scripts/mock-device-enroll.ts
 */

import { generateCanonicalMessage } from "../src/features/enrollement/utils/canonical-message";
import { generateMockDeviceKeyPair } from "../src/features/enrollement/utils/mock-device-keys";

const BASE_URL = process.env.MOCK_BASE_URL ?? "http://localhost:5573";

const mockKeyPair = generateMockDeviceKeyPair();

const FICTIONAL_DEVICE = {
    model: "Pixel 8 (mock)",
    manufacturer: "Google",
    osVersion: "Android 14 (API 34)",
    serial: `MOCK-${Date.now()}`,
    enrollementMethod: "manual" as const,
    publicKey: mockKeyPair.publicKey,
};

async function callJson(method: string, path: string, options: { body?: unknown; token?: string } = {}) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : undefined;

    if (!res.ok) {
        throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}\n${text}`);
    }

    return json;
}

async function main() {
    console.log(`Mock device enrollment against ${BASE_URL}`);
    console.log("Fictional device:", {
        ...FICTIONAL_DEVICE,
        publicKey: `${FICTIONAL_DEVICE.publicKey.slice(0, 24)}...`,
    });

    console.log("\n1) POST /api/v1/enrollement/token-generate");
    const { token } = await callJson("POST", "/api/v1/enrollement/token-generate", { body: {} });
    console.log("   -> enrollmentToken:", token);

    console.log("\n2) GET /api/v1/devices/enroll/challenge");
    const { challenge } = await callJson("GET", "/api/v1/devices/enroll/challenge");
    console.log("   -> challenge:", `${(challenge as string).slice(0, 24)}...`);

    console.log("\n3) Sign the canonical identity message with the mock Keystore key (proof of possession)");
    const timestamp = new Date().toISOString();
    const canonicalMessage = generateCanonicalMessage({
        model: FICTIONAL_DEVICE.model,
        manufacturer: FICTIONAL_DEVICE.manufacturer,
        osVersion: FICTIONAL_DEVICE.osVersion,
        serialNumber: FICTIONAL_DEVICE.serial,
        imei: "",
        macAddress: "",
        androidId: "",
        method: FICTIONAL_DEVICE.enrollementMethod,
        timestamp,
        publicKey: mockKeyPair.publicKey,
        challenge,
    });
    const signature = mockKeyPair.sign(canonicalMessage);
    console.log("   -> signature:", `${signature.slice(0, 24)}...`);

    console.log("\n4) POST /api/v1/devices/enroll");
    const { deviceId, deviceToken } = await callJson("POST", "/api/v1/devices/enroll", {
        body: { enrollmentToken: token, challenge, timestamp, signature, device: FICTIONAL_DEVICE },
    });
    console.log("   -> deviceId:", deviceId);
    console.log("   -> deviceToken:", `${(deviceToken as string).slice(0, 24)}...`);

    console.log(`\n5) POST /api/v1/devices/${deviceId}/heartbeat`);
    const heartbeatResult = await callJson("POST", `/api/v1/devices/${deviceId}/heartbeat`, {
        token: deviceToken,
        body: { battery: 87, storageFreeBytes: 12_345_678, online: true, ts: Date.now() },
    });
    console.log("   -> response:", heartbeatResult);

    console.log("\nDone — the fictional device enrolled and checked in successfully.");
}

main().catch((error) => {
    console.error("\nMock enrollment failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
