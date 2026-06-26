package com.openmdm.agent.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Wire contract shared with the (not-yet-implemented) MDM backend.
 * See the plan: POST /api/v1/devices/enroll | heartbeat | inventory.
 */

@Serializable
data class DeviceInfoDto(
    val model: String,
    val manufacturer: String,
    val osVersion: String,
    val serial: String,
)

@Serializable
data class EnrollRequest(
    val enrollmentToken: String,
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
)

@Serializable
data class StorageDto(
    val totalBytes: Long,
    val freeBytes: Long,
)

@Serializable
data class InstalledAppDto(
    val packageName: String,
    val versionName: String,
    val system: Boolean,
)

@Serializable
data class InventoryRequest(
    val os: String,
    val model: String,
    val manufacturer: String,
    val serial: String,
    val storage: StorageDto,
    val apps: List<InstalledAppDto>,
)

@Serializable
data class SimpleOkResponse(
    val ok: Boolean = true,
)
