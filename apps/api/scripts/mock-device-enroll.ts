/**
 * Simulates a fictional Android device going through the enrollment
 * provisioning flow against a running dev server: obtain a token, enroll,
 * then send one heartbeat with the issued device JWT.
 *
 * Usage:
 *   npx tsx scripts/mock-device-enroll.ts
 *   MOCK_BASE_URL=http://localhost:5573 npx tsx scripts/mock-device-enroll.ts
 */

import { generateMockDevicePublicKey } from "../src/features/enrollement/utils/mock-device-keys";

const BASE_URL = process.env.MOCK_BASE_URL ?? "http://localhost:5573";

const FICTIONAL_DEVICE = {
    model: "Pixel 8 (mock)",
    manufacturer: "Google",
    osVersion: "Android 14 (API 34)",
    serial: `MOCK-${Date.now()}`,
    enrollementMethod: "manual" as const,
    publicKey: generateMockDevicePublicKey(),
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

    console.log("\n2) POST /api/v1/devices/enroll");
    const { deviceId, deviceToken } = await callJson("POST", "/api/v1/devices/enroll", {
        body: { enrollmentToken: token, device: FICTIONAL_DEVICE },
    });
    console.log("   -> deviceId:", deviceId);
    console.log("   -> deviceToken:", `${(deviceToken as string).slice(0, 24)}...`);

    console.log(`\n3) POST /api/v1/devices/${deviceId}/heartbeat`);
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
