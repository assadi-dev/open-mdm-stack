/**
 * Prints a ready-to-send body for `POST /api/v1/devices/enroll`, to try the
 * endpoint by hand (Insomnia, curl...) — without enrolling anything itself.
 *
 * A static body can't work: `challenge` is a single-use, short-lived nonce
 * (ENROLLMENT_CHALLENGE_TTL_SECONDS, 120 s by default) and `signature` is the
 * ECDSA signature of the canonical identity message, which contains that
 * challenge. So this script fetches a fresh challenge from the running
 * server, signs it with a throw-away mock Keystore key pair, and prints the
 * JSON. Send it before the challenge expires; each run is a new fictional
 * device (new androidId + new key pair).
 *
 * Only the JSON goes to stdout (the rest goes to stderr), so it can be piped:
 *   npm run mock:enroll-body | pbcopy
 *
 * Usage:
 *   npx tsx scripts/mock-enroll-body.ts
 *   MOCK_NAME="Terrain-Lyon" MOCK_METHOD=qr npx tsx scripts/mock-enroll-body.ts
 *   MOCK_BASE_URL=http://localhost:5573 npx tsx scripts/mock-enroll-body.ts
 *
 * Env:
 *   MOCK_BASE_URL  server to ask for the challenge (default http://localhost:5573)
 *   MOCK_METHOD    enrollmentMethod: qr | manual | usb (default qr)
 *   MOCK_NAME      the device name carried by a provisioning QR; omitted from the body when not set
 */

import { generateCanonicalMessage } from "../src/features/enrollment/utils/canonical-message";
import { generateMockAndroidId, generateMockDeviceKeyPair } from "../src/features/enrollment/utils/mock-device-keys";

const BASE_URL = process.env.MOCK_BASE_URL ?? "http://localhost:5573";
const METHODS = ["qr", "manual", "usb"] as const;
type Method = (typeof METHODS)[number];

const method = (process.env.MOCK_METHOD ?? "qr") as Method;
if (!METHODS.includes(method)) {
    console.error(`MOCK_METHOD must be one of ${METHODS.join(" | ")} (got "${process.env.MOCK_METHOD}")`);
    process.exit(1);
}
const name = process.env.MOCK_NAME?.trim() || undefined;

const main = async () => {
    const res = await fetch(`${BASE_URL}/api/v1/enrollment/challenge`);
    if (!res.ok) throw new Error(`GET /api/v1/enrollment/challenge -> ${res.status} ${res.statusText}`);
    const { challenge, expiresAt } = (await res.json()) as { challenge: string; expiresAt: string };

    const keyPair = generateMockDeviceKeyPair();
    const device = {
        androidId: generateMockAndroidId(),
        model: "Pixel 8 (mock)",
        manufacturer: "Google",
        brand: "google",
        release: "14",
        sdkVersion: 34,
        serial: "MOCK0001",
        enrollmentMethod: method,
        publicKey: keyPair.publicKey,
    };

    // The server rebuilds this exact string to verify the signature: the field values (and `method`) must match `device`.
    const timestamp = new Date().toISOString();
    const canonicalMessage = generateCanonicalMessage({
        model: device.model,
        manufacturer: device.manufacturer,
        release: device.release,
        serialNumber: device.serial,
        imei: "",
        macAddress: "",
        androidId: device.androidId,
        method: device.enrollmentMethod,
        timestamp,
        publicKey: device.publicKey,
        challenge,
    });

    const body = { challenge, timestamp, signature: keyPair.sign(canonicalMessage), device, ...(name && { name }) };

    const secondsLeft = Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000);
    console.error(`POST ${BASE_URL}/api/v1/devices/enroll  (no auth header)`);
    console.error(`The challenge expires at ${expiresAt}, in ~${secondsLeft} s, and works once.\n`);
    console.log(JSON.stringify(body, null, 2));
};

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
