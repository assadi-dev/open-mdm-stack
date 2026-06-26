package com.openmdm.agent.data.repository

import android.util.Log
import com.openmdm.agent.data.local.SecureDeviceStore
import com.openmdm.agent.data.remote.DeviceApi
import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
import com.openmdm.agent.inventory.InventoryCollector

/**
 * Orchestrates the device lifecycle against the backend + secure local store:
 * enroll → persist identity → report inventory, then periodic heartbeats.
 */
class DeviceRepository(
    private val api: DeviceApi,
    private val store: SecureDeviceStore,
    private val inventory: InventoryCollector,
) {

    val isEnrolled: Boolean get() = store.isEnrolled

    val deviceId: String? get() = store.deviceId

    val lastHeartbeatAt: Long get() = store.lastHeartbeatAt

    /**
     * Enrolls the device with the server using the provisioning token, persists
     * the returned identity, then pushes a first inventory snapshot.
     */
    suspend fun enroll(enrollmentToken: String, baseUrl: String?): Result<Unit> = runCatching {
        baseUrl?.let { store.serverBaseUrl = it }
        val response = api.enroll(
            EnrollRequest(
                enrollmentToken = enrollmentToken,
                device = inventory.deviceInfo(),
            )
        )
        store.saveEnrollment(response.deviceId, response.deviceToken)
        Log.i(TAG, "Enrolled as deviceId=${response.deviceId}")
        // Best-effort first inventory; failure here must not fail enrollment.
        sendInventory().onFailure { Log.w(TAG, "Initial inventory failed", it) }
        Unit
    }.onFailure { Log.e(TAG, "Enrollment failed", it) }

    suspend fun sendHeartbeat(): Result<Unit> = runCatching {
        val id = store.deviceId ?: error("Device not enrolled")
        api.heartbeat(
            id,
            HeartbeatRequest(
                battery = inventory.batteryLevel(),
                storageFreeBytes = inventory.freeStorageBytes(),
                online = true,
                ts = System.currentTimeMillis(),
            ),
        )
        store.lastHeartbeatAt = System.currentTimeMillis()
        Unit
    }.onFailure { Log.w(TAG, "Heartbeat failed", it) }

    suspend fun sendInventory(): Result<Unit> = runCatching {
        val id = store.deviceId ?: error("Device not enrolled")
        api.inventory(id, inventory.fullInventory())
        Unit
    }

    private companion object {
        const val TAG = "DeviceRepository"
    }
}
