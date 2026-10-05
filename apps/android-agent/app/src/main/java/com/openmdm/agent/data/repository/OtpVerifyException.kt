package com.openmdm.agent.data.repository

import java.io.IOException
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import retrofit2.HttpException

/**
 * Why `POST enrollment/otp-verify` did not hand back a challenge. It is the failure carried by the `Result` of
 * [DeviceRepository.enroll] when the code step fails, so the screen can tell "retype the code" from "try again later".
 *
 * [message] is the one sent by the server when there is one (`{ "message": "Invalid OTP" }`), otherwise a generic text
 * — meant for logs, not to be displayed as is.
 */
sealed class OtpVerifyException(message: String, cause: Throwable? = null) : Exception(message, cause) {

    /**
     * The code is not acceptable: unknown, expired or already used (400 "Invalid OTP"), not made of
     * [DeviceRepository.OTP_LENGTH] digits (400 "Validation Failed", also checked locally before any request).
     * Retrying with the same code is pointless; the admin has to generate a new one.
     */
    class InvalidCode(message: String, cause: Throwable? = null) : OtpVerifyException(message, cause)

    /** Any other 4xx: the request itself was refused, which a retry won't change. */
    class Rejected(val status: Int, message: String, cause: Throwable? = null) : OtpVerifyException(message, cause)

    /**
     * 5xx: the server failed. The code may or may not have been consumed (it is, just before the challenge is
     * minted), so a retry with the same code can still come back as [InvalidCode].
     */
    class Server(val status: Int, message: String, cause: Throwable? = null) : OtpVerifyException(message, cause)

    /** The server could not be reached (no network, timeout, wrong base URL…). */
    class Network(cause: IOException) : OtpVerifyException("Server unreachable", cause)
}

/**
 * Maps what a failed `verifyOtp` call throws to an [OtpVerifyException]; anything unexpected (a serialization error…)
 * is returned untouched rather than disguised as one of the cases above.
 */
internal fun Throwable.toOtpVerifyException(): Throwable = when (this) {
    is OtpVerifyException -> this
    is HttpException -> {
        val status = code()
        // `message` is "HTTP 404 Client Error"; Retrofit's own `message()` would be just "Client Error".
        val reason = serverMessage() ?: message ?: "HTTP $status"
        when (status) {
            400 -> OtpVerifyException.InvalidCode(reason, this)
            in 500..599 -> OtpVerifyException.Server(status, reason, this)
            else -> OtpVerifyException.Rejected(status, reason, this)
        }
    }
    is IOException -> OtpVerifyException.Network(this)
    else -> this
}

/** Error body of the API: `{ "message": … }` (see `errorHandler` in apps/api/src/lib/global.ts). */
@Serializable
private data class ApiErrorBody(val message: String? = null)

private val errorBodyJson = Json { ignoreUnknownKeys = true }

private fun HttpException.serverMessage(): String? = runCatching {
    response()?.errorBody()?.string()?.let { errorBodyJson.decodeFromString<ApiErrorBody>(it).message }
}.getOrNull()?.takeIf { it.isNotBlank() }
