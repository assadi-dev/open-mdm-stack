package com.openmdm.agent.ui

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Extracts enrollment credentials from a scanned QR. Accepts:
 *  1. the Device Owner provisioning JSON (reads the admin-extras bundle),
 *  2. a plain `{ "enrollmentToken": "...", "serverBaseUrl": "..." }` JSON,
 *  3. a bare string (a token or short code encoded directly).
 */
object EnrollmentQrParser {

    data class Result(val tokenOrCode: String, val baseUrl: String?)

    private val json = Json { ignoreUnknownKeys = true }

    fun parse(raw: String): Result? {
        val text = raw.trim()
        if (text.isEmpty()) return null

        if (text.startsWith("{")) {
            val obj = runCatching { json.parseToJsonElement(text).jsonObject }.getOrNull()
            if (obj != null) {
                // Provisioning format: token lives in the admin-extras bundle.
                obj["android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE"]
                    ?.let { runCatching { it.jsonObject }.getOrNull() }
                    ?.let { extras ->
                        val token = extras["enrollmentToken"]?.jsonPrimitive?.contentOrNull
                        if (!token.isNullOrBlank()) {
                            return Result(token, extras["serverBaseUrl"]?.jsonPrimitive?.contentOrNull)
                        }
                    }
                // Plain enrollment JSON.
                val token = obj["enrollmentToken"]?.jsonPrimitive?.contentOrNull
                if (!token.isNullOrBlank()) {
                    return Result(token, obj["serverBaseUrl"]?.jsonPrimitive?.contentOrNull)
                }
            }
            return null
        }

        // Bare token / short code.
        return Result(text, null)
    }
}
