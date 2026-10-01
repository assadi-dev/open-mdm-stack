package com.openmdm.agent.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Wire contract shared with the MDM backend (pinned-key enrollment, see
 * apps/api/src/features/enrollment and apps/api/src/features/device):
 * GET enrollment/challenge, POST devices/enroll | heartbeat | inventory.
 */

/**
 * Device identity/facts, embedded as the `device` object of [EnrollRequest].
 * All fields but [model]/[manufacturer]/[release]/[sdkVersion]/[publicKey]
 * are optional per the server's `deviceInfoSchema` — an absent optional value must be
 * omitted from the JSON (not sent as `null`; zod's `.optional()` rejects an
 * explicit null), which is why the Retrofit [kotlinx.serialization.json.Json]
 * instance building this request is configured with `explicitNulls = false`
 * (see di/AppContainer.kt).
 *
 * [publicKey] is required by the server schema but is not a fact
 * [com.openmdm.agent.inventory.InventoryCollector] can know on its own (it
 * comes from [com.openmdm.agent.data.local.DeviceKeyStore]); callers that
 * only need the device facts for display/inventory use the default `""` and
 * never send that instance to `enroll`.
 */
@Serializable
data class DeviceInfoDto(
    val androidId: String? = null,
    val brand: String,
    val model: String,
    val manufacturer: String,
    val osVersion: String,
    val release: String,
    val sdkVersion: Int,
    val serial: String? = null,
    val imei: String? = null,
    val macAddress: String? = null,
    val ipAddress: String? = null,
    val enrollmentStatus: String? = null,
    val enrollmentMethod: String? = null,
    val publicKey: String = "",
    val agentVersionName: String? = null,
    val agentVersionCode: Int? = null,
    val agentPackage: String? = null,

)

/**
 * Single-use, short-lived anti-replay nonce fetched right before enrolling
 * (never cached/reused — see [com.openmdm.agent.data.repository.DeviceRepository.enroll]).
 */
@Serializable
data class ChallengeResponse(
    val challenge: String,
    val ttlSeconds: Int,
    val expiresAt: String,
)

/**
 * Pinned-key enrollment request. There is no admin-issued enrollment token:
 * [challenge] (single-use, fetched from `GET enrollment/challenge`) is the
 * sole authorization, and [signature] is the proof-of-possession signature
 * (ECDSA/SHA-256, DER, base64) over the canonical message built by
 * [com.openmdm.agent.security.CanonicalMessage] with the private key backing
 * `device.publicKey`.
 */
@Serializable
data class EnrollRequest(
    val challenge: String,
    val timestamp: String,
    val signature: String,
    val device: DeviceInfoDto,
)

@Serializable
data class EnrollResponse(
    val deviceId: String,
    val deviceToken: String,
)

@Serializable
data class HeartbeatRequest(
    val battery: Int,
    val storageFreeBytes: Long,
    val online: Boolean,
    val ts: Long,
    // Screen power state (on/off) — see ScreenStateReporter.kt for the
    // real-time counterpart on mdm/devices/{id}/screen.
    val screenOn: Boolean,
    val sdkVersion: Int? = null,
    val ipAddress: String? = null,
    val agentVersionName: String? = null,
    val agentVersionCode: Int? = null,
    val agentPackage: String? = null,
)

@Serializable
data class StorageDto(
    val totalBytes: Long,
    val freeBytes: Long,
    val usedBytes: Long,
)

@Serializable
data class InstalledAppDto(
    val packageName: String,
    val versionName: String,
    val versionCode:Long,
    val system: Boolean,
)

@Serializable
data class LocationDto(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float?
)

@Serializable
data class BatteryDto(
    val level: Int,
    val charging: Boolean,
    val health: String,
)

@Serializable
data class NetworkDto(
    val type: String,
    val name: String?,
    val ipAddress: String?,
    val macAddress: String?,
)

@Serializable
data class MemoryDto(
    val totalBytes: Long,
    val usedBytes: Long,
)


@Serializable
data class InventoryRequest(
    val brand: String,
    val os: String,
    val model: String,
    val manufacturer: String,
    val serial: String,
    val storage: StorageDto,
    val apps: List<InstalledAppDto>,
    val battery: BatteryDto,
    val network: NetworkDto,
    val memory: MemoryDto,
    val locations:LocationDto
)

/**
 * Body for `PATCH devices/{id}/telemetry` — mirrors `telemetryPatchSchema`
 * in apps/api/src/features/device/dto/schema.ts. The agent always reports
 * every group it can currently read (all non-null), but the endpoint itself
 * treats each one as an independent partial update merged into what's
 * already stored (see DeviceRepository.patchTelemetry server-side), hence
 * every field here being optional on the wire.
 */
@Serializable
data class TelemetryRequest(
    val network: NetworkDto? = null,
    val memory: MemoryDto? = null,
    val storage: StorageDto? = null,
    val battery: BatteryDto? = null,
    val location: LocationDto? = null,
)

@Serializable
data class SimpleOkResponse(
    val ok: Boolean = true,
)
