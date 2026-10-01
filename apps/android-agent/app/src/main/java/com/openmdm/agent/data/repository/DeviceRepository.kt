package com.openmdm.agent.data.repository

import android.util.Log
import com.openmdm.agent.data.local.DeviceKeyStore
import com.openmdm.agent.data.local.SecureDeviceStore
import com.openmdm.agent.data.remote.DeviceApi
import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
import com.openmdm.agent.data.remote.dto.TelemetryRequest
import com.openmdm.agent.inventory.InventoryCollector
import com.openmdm.agent.security.CanonicalMessage
import java.time.Instant
import kotlinx.coroutines.CancellationException

/**
 * Orchestrates the device lifecycle against the backend + secure local store:
 * enroll → persist identity → report telemetry, then periodic heartbeats.
 */
class DeviceRepository(
    private val api: DeviceApi,
    private val store: SecureDeviceStore,
    private val inventory: InventoryCollector,
    private val deviceKeyStore: DeviceKeyStore,
) {

    val isEnrolled: Boolean get() = store.isEnrolled

    val deviceId: String? get() = store.deviceId

    val lastHeartbeatAt: Long get() = store.lastHeartbeatAt

    /**
     * Enrolls the device using the server's pinned-key handshake: fetches a
     * fresh single-use challenge (never cached — it has a short TTL and is
     * consumed on first use), signs the canonical device-identity message
     * with the device's Keystore key (proof of possession), then submits the
     * enrollment. There is no admin-issued enrollment token to pass in: the
     * challenge itself is the sole authorization.
     *
     * [enrollmentMethod] is opaque to this method beyond being echoed into
     * the signed message and the request body — the server expects one of
     * "qr" | "manual" | "usb".
     */
    suspend fun enroll(baseUrl: String?, enrollmentMethod: String = "manual"): Result<Unit> = runCatching {
        baseUrl?.let { store.serverBaseUrl = it }

        // Generated once and reused for the app's lifetime: the server pins
        // this key to the device's androidId on first enrollment and rejects
        // a different key on re-enrollment.
        deviceKeyStore.ensureKeyPair()
        val publicKey = deviceKeyStore.publicKeyBase64()

        val challenge = api.challenge()
        val timestamp = Instant.now().toString()
        val device = inventory.deviceInfo(
            publicKey = publicKey,
            enrollmentMethod = enrollmentMethod,
        )
        val canonicalMessage = CanonicalMessage.build(
            model = device.model,
            manufacturer = device.manufacturer,
            release = device.release,
            serialNumber = device.serial,
            imei = device.imei,
            macAddress = device.macAddress,
            androidId = device.androidId,
            method = device.enrollmentMethod,
            timestamp = timestamp,
            publicKey = publicKey,
            challenge = challenge.challenge,
        )
        val signature = deviceKeyStore.sign(canonicalMessage)

        val response = api.enroll(
            EnrollRequest(
                challenge = challenge.challenge,
                timestamp = timestamp,
                signature = signature,
                device = device,
            )
        )
        store.saveEnrollment(response.deviceId, response.deviceToken)
        Log.i(TAG, "Enrolled as deviceId=${response.deviceId}")
        // Best-effort first telemetry report; failure here must not fail enrollment.
        sendTelemetry().onFailure { Log.w(TAG, "Initial telemetry report failed", it) }
        Unit
    }.onFailure {
        if (it is CancellationException) throw it
        Log.e(TAG, "Enrollment failed", it)
    }

    suspend fun sendHeartbeat(): Result<Unit> = runCatching {
        val id = store.deviceId ?: error("Device not enrolled")
        val device = inventory.deviceInfo()
        api.heartbeat(
            id,
            HeartbeatRequest(
                battery = inventory.batteryInventory.batteryLevel(),
                storageFreeBytes = inventory.storageInventory.getFreeStorageBytes(),
                online = true,
                ts = System.currentTimeMillis(),
                screenOn = inventory.isScreenOn(),
                sdkVersion = device.sdkVersion,
                ipAddress = inventory.networkInventory.getIpAddress(),
                agentVersionName = device.agentVersionName,
                agentVersionCode = device.agentVersionCode,
                agentPackage = device.agentPackage,
            ),
        )
        store.lastHeartbeatAt = System.currentTimeMillis()
        Unit
    }.onFailure {
        if (it is CancellationException) throw it
        Log.w(TAG, "Heartbeat failed", it)
    }

    /**
     * Reports the device's current hardware facts (network, memory, storage,
     * battery, location) to `PATCH devices/{id}/telemetry`. Separate from
     * [sendHeartbeat] and failing independently of it — see [HeartbeatWorker]
     * and [com.openmdm.agent.ui.AgentViewModel.forceHeartbeat], which call
     * both and handle each result on its own.
     *
     * Stands in for a full inventory report for now — [DeviceApi.inventory]
     * (apps list included) is a later chantier.
     */
    suspend fun sendTelemetry(): Result<Unit> = runCatching {
        val id = store.deviceId ?: error("Device not enrolled")
        api.telemetry(
            id,
            TelemetryRequest(
                network = inventory.networkInventory.readNetworkInfo(),
                memory = inventory.storageInventory.readMemory(),
                storage = inventory.storageInventory.readStorage(),
                battery = inventory.batteryInventory.readBatteryStatus(),
                location = inventory.networkInventory.readLocation(),
            ),
        )
        Unit
    }.onFailure {
        if (it is CancellationException) throw it
        Log.w(TAG, "Telemetry report failed", it)
    }

    private companion object {
        const val TAG = "DeviceRepository"
    }
}
