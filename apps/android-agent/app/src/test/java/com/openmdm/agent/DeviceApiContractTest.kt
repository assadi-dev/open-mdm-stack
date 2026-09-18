package com.openmdm.agent

import com.openmdm.agent.data.remote.DeviceApi
import com.openmdm.agent.data.remote.dto.DeviceInfoDto
import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
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
 * deserialization for the pinned-key enrollment handshake (challenge + signed
 * canonical message — no admin-issued enrollment token, see
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
    fun heartbeat_usesDeviceIdInPathAndParsesOk() = runTest {
        server.enqueue(
            MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""{"ok":true}""")
        )

        val response = api.heartbeat(
            deviceId = "dev-1",
            body = HeartbeatRequest(battery = 80, storageFreeBytes = 1024L, online = true, ts = 1L),
        )

        assertTrue(response.ok)
        val recorded = server.takeRequest()
        assertEquals("/api/v1/devices/dev-1/heartbeat", recorded.path)
    }
}
