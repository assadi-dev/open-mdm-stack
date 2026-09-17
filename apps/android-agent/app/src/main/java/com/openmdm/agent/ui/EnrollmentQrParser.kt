package com.openmdm.agent.ui

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Extracts the server base URL from a scanned QR. There is no enrollment
 * token/code to extract anymore — enrollment is self-service (the agent
 * fetches its own single-use challenge from `GET enrollment/challenge` right
 * before enrolling, see [com.openmdm.agent.data.repository.DeviceRepository.enroll]).
 *
 * A Device Owner provisioning QR (see
 * apps/api/src/features/enrollment/utils/generators.ts#buildProvisioningPayload)
 * does embed a `challenge` in its admin-extras bundle, but it is
 * intentionally ignored here: that challenge has a short TTL (120s by
 * default) and Device Owner provisioning (wipe + DPC install + boot) can
 * easily outlast it, so trusting it would likely fail with an
 * already-expired/consumed challenge. Only `serverBaseUrl` is read from the
 * QR.
 *
 * Accepts:
 *  1. the Device Owner provisioning JSON (reads the admin-extras bundle),
 *  2. a plain `{ "serverBaseUrl": "..." }` JSON,
 *  3. a bare string, treated directly as the server base URL.
 */
object EnrollmentQrParser {

    data class Result(val baseUrl: String?)

    private val json = Json { ignoreUnknownKeys = true }

    fun parse(raw: String): Result? {
        val text = raw.trim()
        if (text.isEmpty()) return null

        if (text.startsWith("{")) {
            val obj = runCatching { json.parseToJsonElement(text).jsonObject }.getOrNull()
                ?: return null

            // Provisioning format: serverBaseUrl lives in the admin-extras bundle.
            obj["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"]
                ?.let { runCatching { it.jsonObject }.getOrNull() }
                ?.let { extras ->
                    val baseUrl = extras["serverBaseUrl"]?.jsonPrimitive?.contentOrNull
                    if (!baseUrl.isNullOrBlank()) return Result(baseUrl)
                }

            // Plain enrollment JSON.
            val baseUrl = obj["serverBaseUrl"]?.jsonPrimitive?.contentOrNull
            return if (!baseUrl.isNullOrBlank()) Result(baseUrl) else null
        }

        // Bare string: the server base URL directly.
        return Result(text)
    }
}
