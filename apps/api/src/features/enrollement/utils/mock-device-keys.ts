import { generateKeyPairSync } from "crypto";

/**
 * Mock-only: simulates the EC key pair an Android agent generates in its
 * Keystore at enrollment (secp256r1, matching AndroidKeyStore's default EC
 * curve). Not used by any real device flow — only by
 * scripts/mock-device-enroll.ts to produce a plausible `publicKey` value.
 * A real device's public key must come from the agent itself, never be
 * derived server-side.
 */
export const generateMockDevicePublicKey = () => {
    const { publicKey } = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
    });

    return publicKey.export({ type: "spki", format: "der" }).toString("base64");
};
