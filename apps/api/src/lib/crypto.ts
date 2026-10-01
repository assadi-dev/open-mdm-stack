import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { ENV } from "@config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended nonce size for GCM

const key = Buffer.from(ENV.WIFI_NETWORK_ENCRYPTION_KEY, "hex");

/**
 * AES-256-GCM for secrets that must be recovered in plaintext later (e.g. a
 * Wi-Fi PSK embedded in a device provisioning payload) — unlike login
 * passwords, these can't be one-way hashed. Each call uses a fresh random IV;
 * iv/authTag/ciphertext are packed together so a single text column can
 * store the result.
 */
export const encryptSecret = (plaintext: string): string => {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map((buf) => buf.toString("base64")).join(":");
};

export const decryptSecret = (payload: string): string => {
    const [ivB64, authTagB64, ciphertextB64] = payload.split(":");
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextB64, "base64")),
        decipher.final(),
    ]);
    return plaintext.toString("utf8");
};
