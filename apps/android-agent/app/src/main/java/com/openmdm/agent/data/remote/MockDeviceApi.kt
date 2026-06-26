package com.openmdm.agent.data.remote

import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.EnrollResponse
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
import com.openmdm.agent.data.remote.dto.InventoryRequest
import com.openmdm.agent.data.remote.dto.SimpleOkResponse
import kotlinx.coroutines.delay
import java.util.UUID

/**
 * In-memory stub used while the real backend device endpoints do not exist yet
 * (selected when BuildConfig.USE_MOCK is true). It lets the full enroll →
 * heartbeat → inventory flow run on a device/emulator without a server.
 */
class MockDeviceApi : DeviceApi {

    override suspend fun enroll(body: EnrollRequest): EnrollResponse {
        delay(300)
        return EnrollResponse(
            deviceId = "mock-" + UUID.randomUUID().toString().take(8),
            deviceToken = "mock-jwt-" + UUID.randomUUID().toString(),
        )
    }

    override suspend fun heartbeat(deviceId: String, body: HeartbeatRequest): SimpleOkResponse {
        delay(150)
        return SimpleOkResponse(ok = true)
    }

    override suspend fun inventory(deviceId: String, body: InventoryRequest): SimpleOkResponse {
        delay(150)
        return SimpleOkResponse(ok = true)
    }
}
