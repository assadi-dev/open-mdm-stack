package com.openmdm.agent.security

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.spec.ECGenParameterSpec
import java.security.spec.X509EncodedKeySpec
import java.util.Base64

/**
 * Exercises the exact signing/encoding path used on-device
 * ([com.openmdm.agent.data.local.DeviceKeyStore]), but with a plain JCA "EC"
 * key pair instead of one backed by `AndroidKeyStore` — the Keystore
 * provider only exists on a real device/emulator, so it can't be exercised
 * in a host JVM unit test. `AndroidKeyStore`-resident keys implement the
 * same `PrivateKey`/`PublicKey` JCA interfaces as this test's key pair, so
 * [EcdsaSigner] itself (the part that matters for wire compatibility) is
 * fully covered here.
 *
 * Mirrors apps/api/src/features/device/utils/keys.ts#verifyDeviceSignature:
 * the server imports the public key via
 * `createPublicKey({ key, format: "der", type: "spki" })` and verifies with
 * `crypto.verify("sha256", data, publicKey, signature)`. This test performs
 * the equivalent round trip in the JVM: decode the base64 SPKI/DER bytes
 * with `KeyFactory("EC")` + `X509EncodedKeySpec`, then verify the DER
 * ECDSA signature against the reconstructed key.
 */
class EcdsaSignerTest {

    private fun generateP256KeyPair() =
        KeyPairGenerator.getInstance("EC").apply {
            initialize(ECGenParameterSpec("secp256r1"))
        }.generateKeyPair()

    @Test
    fun sign_producesASignatureThatVerifiesAgainstTheReconstructedSpkiPublicKey() {
        val keyPair = generateP256KeyPair()
        val canonicalMessage = CanonicalMessage.build(
            model = "Pixel 8",
            manufacturer = "Google",
            osVersion = "Android 14 (API 34)",
            serialNumber = "SER123",
            imei = null,
            macAddress = null,
            androidId = "abc123",
            method = "manual",
            timestamp = "2026-01-01T00:00:00.000Z",
            publicKey = EcdsaSigner.publicKeyBase64(keyPair.public),
            challenge = "chal-1",
        )

        val signature = EcdsaSigner.sign(canonicalMessage, keyPair.private)

        // Round-trip the public key exactly like the Node server does:
        // base64 -> DER bytes -> SPKI-decoded PublicKey.
        val publicKeyBase64 = EcdsaSigner.publicKeyBase64(keyPair.public)
        val derBytes = Base64.getDecoder().decode(publicKeyBase64)
        val reconstructedPublicKey = KeyFactory.getInstance("EC")
            .generatePublic(X509EncodedKeySpec(derBytes))

        assertTrue(EcdsaSigner.verify(canonicalMessage, signature, reconstructedPublicKey))
    }

    @Test
    fun sign_rejectsATamperedMessage() {
        val keyPair = generateP256KeyPair()
        val signature = EcdsaSigner.sign("original-message", keyPair.private)

        assertTrue(EcdsaSigner.verify("original-message", signature, keyPair.public))
        assertTrue(!EcdsaSigner.verify("tampered-message", signature, keyPair.public))
    }

    @Test
    fun publicKeyBase64_isStandardBase64EncodedSpkiDer() {
        val keyPair = generateP256KeyPair()
        val encoded = EcdsaSigner.publicKeyBase64(keyPair.public)

        // Decodes cleanly with the *standard* base64 decoder (fails on
        // base64url's '-'/'_' alphabet) and is exactly the fixed size of an
        // uncompressed-point P-256 SPKI/DER public key (as produced by
        // Node's `publicKey.export({ type: "spki", format: "der" })` on the
        // server side) — i.e. not raw/compressed-point encoding.
        val decoded = Base64.getDecoder().decode(encoded)
        assertEquals(91, decoded.size)

        val reconstructed = KeyFactory.getInstance("EC")
            .generatePublic(X509EncodedKeySpec(decoded))
        assertTrue(reconstructed.encoded.contentEquals(keyPair.public.encoded))
    }
}
