package com.openmdm.agent.data.local

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.openmdm.agent.security.EcdsaSigner
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.spec.ECGenParameterSpec

/**
 * Owns the device's long-lived enrollment identity key pair: EC/P-256
 * (secp256r1), generated once directly inside `AndroidKeyStore` (the private
 * key material never leaves the secure hardware/keystore and is never
 * exported) and reused for the lifetime of the app install.
 *
 * The server pins the device's public key on first enrollment (per
 * `androidId`) and rejects any re-enrollment attempt presenting a different
 * key (see apps/api/src/features/device/service.ts). Regenerating the pair on
 * every enroll attempt would therefore permanently lock a device out after
 * its first successful enrollment (e.g. on retry after a network failure
 * mid-enroll) — [ensureKeyPair] is idempotent for that reason: it only ever
 * generates a key the first time, checking [KeyStore.containsAlias] first.
 */
class DeviceKeyStore(private val alias: String = DEFAULT_ALIAS) {

    private val keyStore: KeyStore = KeyStore.getInstance(PROVIDER).apply { load(null) }

    /** Generates the key pair on first call; a no-op on every subsequent call. */
    fun ensureKeyPair() {
        if (keyStore.containsAlias(alias)) return
        val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, PROVIDER)
        val spec = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN)
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setAlgorithmParameterSpec(ECGenParameterSpec(CURVE))
            .build()
        generator.initialize(spec)
        generator.generateKeyPair()
    }

    /** SPKI/DER public key, base64-standard — sent as `device.publicKey` at enrollment. */
    fun publicKeyBase64(): String {
        ensureKeyPair()
        return EcdsaSigner.publicKeyBase64(entry().certificate.publicKey)
    }

    /** Signs [data] with the Keystore-resident private key; the key itself never leaves the Keystore. */
    fun sign(data: String): String {
        ensureKeyPair()
        return EcdsaSigner.sign(data, entry().privateKey)
    }

    private fun entry(): KeyStore.PrivateKeyEntry =
        keyStore.getEntry(alias, null) as KeyStore.PrivateKeyEntry

    private companion object {
        const val PROVIDER = "AndroidKeyStore"
        const val CURVE = "secp256r1"
        const val DEFAULT_ALIAS = "mdm_device_identity_key"
    }
}
