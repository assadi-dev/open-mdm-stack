package com.openmdm.agent

import com.openmdm.agent.data.remote.DeviceApi
import com.openmdm.agent.data.remote.dto.DeviceInfoDto
import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
import com.openmdm.agent.data.remote.dto.OtpVerifyRequest
import com.openmdm.agent.data.repository.OtpVerifyException
import com.openmdm.agent.data.repository.toOtpVerifyException
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit

/**
 * Validates the Android wire contract against a fake HTTP server, independent
 * of the real backend: endpoint paths, request bodies and response
 * deserialization for the pinned-key enrollment handshake (challenge — or the
 * challenge obtained in exchange for an admin-generated code — + signed
 * canonical message, no admin-issued enrollment token, see
 * apps/api/src/features/device/dto/schema.ts#enrollDeviceSchema).
 */
class DeviceApiContractTest {

    private lateinit var server: MockWebServer
    private lateinit var api: DeviceApi

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        val contentType = "application/json".toMediaType()
        // Mirrors di/AppContainer.kt's Json config: optional fields must be
        // omitted (not sent as explicit `null`) since the server validates
        // with zod's `.optional()`, which rejects `null`.
        val json = Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
            explicitNulls = false
        }
        api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(DeviceApi::class.java)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun challenge_fetchesASingleUseNonce() = runTest {
        server.enqueue(
            MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""{"challenge":"chal-1","ttlSeconds":120,"expiresAt":"2026-01-01T00:02:00.000Z"}""")
        )

        val response = api.challenge()

        assertEquals("chal-1", response.challenge)
        assertEquals(120, response.ttlSeconds)

        val recorded = server.takeRequest()
        assertEquals("GET", recorded.method)
        assertEquals("/api/v1/enrollment/challenge", recorded.path)
    }

    @Test
    fun verifyOtp_postsTheCodeAndParsesTheChallengeItHandsBack() = runTest {
        server.enqueue(
            MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""{"challenge":"chal-otp","ttlSeconds":120,"expiresAt":"2026-01-01T00:02:00.000Z"}""")
        )

        val response = api.verifyOtp(OtpVerifyRequest(code = "012345"))

        assertEquals("chal-otp", response.challenge)
        assertEquals(120, response.ttlSeconds)

        val recorded = server.takeRequest()
        assertEquals("POST", recorded.method)
        assertEquals("/api/v1/enrollment/otp-verify", recorded.path)
        // A string, so the leading zero survives.
        assertEquals("""{"code":"012345"}""", recorded.body.readUtf8())
    }

    @Test
    fun verifyOtp_anInvalidCodeIsMappedToInvalidCodeWithTheServerMessage() = runTest {
        server.enqueue(MockResponse().setResponseCode(400).setHeader("Content-Type", "application/json").setBody("""{"message":"Invalid OTP"}"""))

        val error = failureOfVerifyOtp()

        assertTrue(error is OtpVerifyException.InvalidCode)
        assertEquals("Invalid OTP", error.message)
    }

    @Test
    fun verifyOtp_aMalformedCodeRejectedByValidationIsAlsoInvalidCode() = runTest {
        server.enqueue(
            MockResponse().setResponseCode(400).setHeader("Content-Type", "application/json")
                .setBody("""{"message":"Validation Failed","details":[{"path":["code"],"message":"The code must be 6 digits"}]}""")
        )

        assertTrue(failureOfVerifyOtp() is OtpVerifyException.InvalidCode)
    }

    @Test
    fun verifyOtp_otherClientErrorsAreRejectedAndKeepTheStatus() = runTest {
        server.enqueue(MockResponse().setResponseCode(404).setBody("not json"))

        val error = failureOfVerifyOtp()

        assertTrue(error is OtpVerifyException.Rejected)
        assertEquals(404, (error as OtpVerifyException.Rejected).status)
        // No usable server message: falls back to the HTTP status line.
        assertEquals("HTTP 404 Client Error", error.message)
    }

    @Test
    fun verifyOtp_serverErrorsAreMappedToServerAndKeepTheStatus() = runTest {
        server.enqueue(MockResponse().setResponseCode(503).setHeader("Content-Type", "application/json").setBody("""{"message":"Could not generate a unique OTP, try again"}"""))

        val error = failureOfVerifyOtp()

        assertTrue(error is OtpVerifyException.Server)
        assertEquals(503, (error as OtpVerifyException.Server).status)
    }

    @Test
    fun verifyOtp_anUnreachableServerIsMappedToNetwork() = runTest {
        server.shutdown()

        assertTrue(failureOfVerifyOtp() is OtpVerifyException.Network)
    }

    /** Calls `verifyOtp` through the same mapping the repository applies, and returns what it fails with. */
    private suspend fun failureOfVerifyOtp(): Throwable {
        val error = runCatching { api.verifyOtp(OtpVerifyRequest(code = "123456")) }.exceptionOrNull()
        return requireNotNull(error) { "verifyOtp was expected to fail" }.toOtpVerifyException()
    }

    @Test
    fun enroll_sendsChallengeTimestampSignatureAndParsesIdentity() = runTest {
        server.enqueue(
            MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""{"deviceId":"dev-1","deviceToken":"jwt-1"}""")
        )

        val response = api.enroll(
            EnrollRequest(
                challenge = "chal-1",
                timestamp = "2026-01-01T00:00:00.000Z",
                signature = "c2lnbmF0dXJl",
                device = DeviceInfoDto(
                    androidId = "abc123",
                    brand = "Google",
                    model = "Pixel",
                    manufacturer = "Google",
                    osVersion = "Android 16",
                    release = "16",
                    sdkVersion = 36,
                    serial = "SER123",
                    enrollmentMethod = "manual",
                    publicKey = "cHVibGljS2V5",
                ),
            )
        )

        assertEquals("dev-1", response.deviceId)
        assertEquals("jwt-1", response.deviceToken)

        val recorded = server.takeRequest()
        assertEquals("POST", recorded.method)
        assertEquals("/api/v1/devices/enroll", recorded.path)
        val body = recorded.body.readUtf8()
        assertTrue(body.contains("\"challenge\":\"chal-1\""))
        assertTrue(body.contains("\"timestamp\":\"2026-01-01T00:00:00.000Z\""))
        assertTrue(body.contains("\"signature\":\"c2lnbmF0dXJl\""))
        assertTrue(body.contains("\"publicKey\":\"cHVibGljS2V5\""))
        assertTrue(body.contains("SER123"))
        // No enrollmentToken concept anymore, and absent optional fields
        // (e.g. imei/macAddress here) must be omitted, not sent as `null`.
        assertFalse(body.contains("enrollmentToken"))
        assertFalse(body.contains("null"))
    }

    @Test
    fun enroll_sendsTheDeviceNameFromTheProvisioningQrWhenThereIsOneAndOmitsItOtherwise() = runTest {
        repeat(2) {
            server.enqueue(
                MockResponse()
                    .setHeader("Content-Type", "application/json")
                    .setBody("""{"deviceId":"dev-1","deviceToken":"jwt-1"}""")
            )
        }
        val request = EnrollRequest(
            challenge = "chal-1",
            timestamp = "2026-01-01T00:00:00.000Z",
            signature = "c2lnbmF0dXJl",
            device = DeviceInfoDto(
                brand = "Google",
                model = "Pixel",
                manufacturer = "Google",
                osVersion = "Android 16",
                release = "16",
                sdkVersion = 36,
                enrollmentMethod = "qr",
                publicKey = "cHVibGljS2V5",
            ),
        )

        api.enroll(request.copy(name = "Terrain-Lyon"))
        api.enroll(request)

        // The name is a sibling of `device` (an administrator's label, not an identity fact), never inside it.
        val withName = server.takeRequest().body.readUtf8()
        assertTrue(withName.contains("\"name\":\"Terrain-Lyon\""))
        val deviceObject = withName.substringAfter("\"device\":{").substringBefore("}")
        assertFalse(deviceObject.contains("\"name\""))
        val withoutName = server.takeRequest().body.readUtf8()
        assertFalse(withoutName.contains("\"name\""))
        assertFalse(withoutName.contains("null"))
    }

    @Test
    fun heartbeat_usesDeviceIdInPathAndParsesOk() = runTest {
        server.enqueue(
            MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""{"ok":true}""")
        )

        val response = api.heartbeat(
            deviceId = "dev-1",
            body = HeartbeatRequest(battery = 80, storageFreeBytes = 1024L, online = true, ts = 1L, screenOn = true),
        )

        assertTrue(response.ok)
        val recorded = server.takeRequest()
        assertEquals("/api/v1/devices/dev-1/heartbeat", recorded.path)
    }

    @Test
    fun heartbeat_sendsTheAndroidVersionWhenKnownAndOmitsItOtherwise() = runTest {
        repeat(2) {
            server.enqueue(
                MockResponse()
                    .setHeader("Content-Type", "application/json")
                    .setBody("""{"ok":true}""")
            )
        }
        val heartbeat = HeartbeatRequest(battery = 80, storageFreeBytes = 1024L, online = true, ts = 1L, screenOn = true)

        api.heartbeat(deviceId = "dev-1", body = heartbeat.copy(release = "14"))
        api.heartbeat(deviceId = "dev-1", body = heartbeat)

        assertTrue(server.takeRequest().body.readUtf8().contains(""""release":"14""""))
        // Omitted, not an explicit `null`: the server validates `release` with zod's `.optional()`.
        assertFalse(server.takeRequest().body.readUtf8().contains("release"))
    }
}
