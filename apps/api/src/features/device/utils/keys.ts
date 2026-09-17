import { createPublicKey, verify as verifySignature } from "crypto";

/**
 * Verifies the proof-of-possession signature submitted at enrollment: the
 * agent signs the enrollment token with the private key matching the public
 * key it declares, proving it holds that key before the device is created.
 *
 * `publicKeyBase64` is the SPKI/DER-encoded public key, base64-encoded (as
 * produced by Android Keystore's KeyFactory, or by
 * enrollement/utils/mock-device-keys.ts for the mock agent). `signatureBase64`
 * is the SHA-256/ECDSA signature over `data`, base64-encoded.
 */
export const verifyDeviceSignature = (params: {
    publicKeyBase64: string;
    signatureBase64: string;
    data: string;
}): boolean => {
    try {
        const publicKey = createPublicKey({
            key: Buffer.from(params.publicKeyBase64, "base64"),
            format: "der",
            type: "spki",
        });
        return verifySignature(
            "sha256",
            Buffer.from(params.data),
            publicKey,
            Buffer.from(params.signatureBase64, "base64"),
        );
    } catch {
        return false;
    }
};
