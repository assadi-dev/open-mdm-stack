import { generateKeyPairSync, sign as cryptoSign } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyDeviceSignature } from "../utils/keys";

function makeKeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    return {
        publicKeyBase64: publicKey.export({ type: "spki", format: "der" }).toString("base64"),
        sign: (data: string) => cryptoSign("sha256", Buffer.from(data), privateKey).toString("base64"),
    };
}

describe("verifyDeviceSignature", () => {
    it("accepts a signature produced by the matching private key", () => {
        const keyPair = makeKeyPair();
        const signature = keyPair.sign("the-enrollment-token");

        expect(
            verifyDeviceSignature({
                publicKeyBase64: keyPair.publicKeyBase64,
                signatureBase64: signature,
                data: "the-enrollment-token",
            }),
        ).toBe(true);
    });

    it("rejects a signature produced by a different key pair", () => {
        const keyPair = makeKeyPair();
        const otherKeyPair = makeKeyPair();
        const signature = otherKeyPair.sign("the-enrollment-token");

        expect(
            verifyDeviceSignature({
                publicKeyBase64: keyPair.publicKeyBase64,
                signatureBase64: signature,
                data: "the-enrollment-token",
            }),
        ).toBe(false);
    });

    it("rejects a signature over different data than what's being checked", () => {
        const keyPair = makeKeyPair();
        const signature = keyPair.sign("some-other-token");

        expect(
            verifyDeviceSignature({
                publicKeyBase64: keyPair.publicKeyBase64,
                signatureBase64: signature,
                data: "the-enrollment-token",
            }),
        ).toBe(false);
    });

    it("returns false instead of throwing on malformed input", () => {
        expect(
            verifyDeviceSignature({
                publicKeyBase64: "not-a-valid-key",
                signatureBase64: "not-a-valid-signature",
                data: "the-enrollment-token",
            }),
        ).toBe(false);
    });
});
