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
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit

/**
 * Validates the Android wire contract against a fake HTTP server, independent
 * of the (not-yet-implemented) real backend: endpoint paths, request bodies and
 * response deserialization.
 */
class DeviceApiContractTest {

    private lateinit var server: MockWebServer
    private lateinit var api: DeviceApi

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        val contentType = "application/json".toMediaType()
        api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(Json { ignoreUnknownKeys = true }.asConverterFactory(contentType))
            .build()
            .create(DeviceApi::class.java)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun enroll_sendsTokenAndParsesIdentity() = runTest {
        server.enqueue(
            MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""{"deviceId":"dev-1","deviceToken":"jwt-1"}""")
        )

        val response = api.enroll(
            EnrollRequest(
                enrollmentToken = "enroll-token",
                device = DeviceInfoDto("Pixel", "Google", "Android 16", "SER123"),
            )
        )

        assertEquals("dev-1", response.deviceId)
        assertEquals("jwt-1", response.deviceToken)

        val recorded = server.takeRequest()
        assertEquals("POST", recorded.method)
        assertEquals("/api/v1/devices/enroll", recorded.path)
        val body = recorded.body.readUtf8()
        assertTrue(body.contains("enroll-token"))
        assertTrue(body.contains("SER123"))
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
