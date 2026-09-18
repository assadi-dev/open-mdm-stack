import { CanonicalMessage } from "../entities/generators";

/**
 * Fixed field order for the pipe-separated canonical message signed by the
 * device's Keystore key at enrollment. Must exactly match the Android
 * agent's serialization — do NOT derive this from Object.values/key
 * insertion order, since that's not guaranteed to stay aligned between the
 * Kotlin and TypeScript sides as fields get added.
 *
 * Used on both sides: the agent (and scripts/mock-device-enroll.ts) build
 * this string to sign, and the server rebuilds the exact same string to
 * verify the signature (see device/service.ts).
 */
const CANONICAL_FIELD_ORDER: (keyof CanonicalMessage)[] = [
    "model",
    "manufacturer",
    "release",
    "serialNumber",
    "imei",
    "macAddress",
    "androidId",
    "method",
    "timestamp",
    "publicKey",
    "challenge",
];

export const generateCanonicalMessage = (request: CanonicalMessage): string =>
    CANONICAL_FIELD_ORDER.map((field) => request[field] ?? "").join("|");
