package com.openmdm.agent.security

import java.security.PrivateKey
import java.security.PublicKey
import java.security.Signature
import java.util.Base64

/**
 * ECDSA/P-256/SHA-256 signing and SPKI/DER public-key encoding, deliberately
 * decoupled from `AndroidKeyStore`: it operates on any [PrivateKey]/[PublicKey],
 * so it is exercised in plain-JVM unit tests with a non-Keystore `"EC"` key
 * pair, and reused as-is on-device with the AndroidKeyStore-resident key
 * (whose [PrivateKey]/[PublicKey] instances implement the same JCA
 * interfaces).
 *
 * `"SHA256withECDSA"` produces an ASN.1/DER-encoded signature (the JCA
 * default) — NOT the raw IEEE-P1363 (r||s) format. The server verifies with
 * Node's `crypto.verify("sha256", ...)` against a DER-decoded public key,
 * which expects this same DER signature encoding (see
 * apps/api/src/features/device/utils/keys.ts). Do not switch to
 * `"SHA256withECDSAinP1363Format"` — it would break server-side verification.
 */
object EcdsaSigner {

    private const val SIGNATURE_ALGORITHM = "SHA256withECDSA"

    /** Signs UTF-8 [data] with [privateKey]; returns the DER signature, base64-standard encoded. */
    fun sign(data: String, privateKey: PrivateKey): String {
        val signature = Signature.getInstance(SIGNATURE_ALGORITHM).apply {
            initSign(privateKey)
            update(data.toByteArray(Charsets.UTF_8))
        }
        return Base64.getEncoder().encodeToString(signature.sign())
    }

    /** Verifies [signatureBase64] (DER, base64-standard) over UTF-8 [data]. Test-only helper. */
    fun verify(data: String, signatureBase64: String, publicKey: PublicKey): Boolean {
        val signature = Signature.getInstance(SIGNATURE_ALGORITHM).apply {
            initVerify(publicKey)
            update(data.toByteArray(Charsets.UTF_8))
        }
        return signature.verify(Base64.getDecoder().decode(signatureBase64))
    }

    /**
     * SPKI/DER-encoded public key, base64-standard encoded — the exact wire
     * format the server expects for `device.publicKey`
     * (`createPublicKey({ format: "der", type: "spki" })`).
     */
    fun publicKeyBase64(publicKey: PublicKey): String =
        Base64.getEncoder().encodeToString(publicKey.encoded)
}
