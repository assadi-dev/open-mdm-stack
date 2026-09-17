import { generateKeyPairSync, sign } from "crypto";
import { CanonicalMessage } from "../entities/generators";

/**
 * Mock-only: simulates the EC key pair an Android agent generates in its
 * Keystore at enrollment (secp256r1, matching AndroidKeyStore's default EC
 * curve), plus a `sign` helper standing in for the agent signing with that
 * Keystore key. Not used by any real device flow — only by
 * scripts/mock-device-enroll.ts to produce a plausible `publicKey` +
 * `signature` pair. A real device's key pair must be generated on the
 * device itself; the private key must never exist server-side.
 */
export const generateMockDeviceKeyPair = () => {
    const { publicKey, privateKey } = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
    });

    return {
        publicKey: publicKey.export({ type: "spki", format: "der" }).toString("base64"),
        sign: (data: string) => sign("sha256", Buffer.from(data), privateKey).toString("base64"),
    };
};




export const generateCanonicalMessage = (request: CanonicalMessage): string => {
    const message = Object.values(request).join('|');
    return message

}    