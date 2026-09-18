package com.openmdm.agent.security

/**
 * Builds the pipe-separated canonical message signed (proof of possession) at
 * enrollment. Field order and semantics MUST exactly match the server's
 * `generateCanonicalMessage` (apps/api/src/features/enrollment/utils/canonical-message.ts):
 *
 *   model|manufacturer|release|serialNumber|imei|macAddress|androidId|method|timestamp|publicKey|challenge
 *
 * An absent optional field is an empty string ("") in the message, never
 * omitted and never the literal "null" — see [CanonicalMessage.build].
 *
 * Kept free of any Android/AndroidKeyStore dependency so it's testable with
 * plain JUnit on the host JVM.
 */
object CanonicalMessage {

    fun build(
        model: String,
        manufacturer: String,
        release: String,
        serialNumber: String?,
        imei: String?,
        macAddress: String?,
        androidId: String?,
        method: String?,
        timestamp: String,
        publicKey: String,
        challenge: String,
    ): String = listOf(
        model,
        manufacturer,
        release,
        serialNumber.orEmpty(),
        imei.orEmpty(),
        macAddress.orEmpty(),
        androidId.orEmpty(),
        method.orEmpty(),
        timestamp,
        publicKey,
        challenge,
    ).joinToString("|")
}
