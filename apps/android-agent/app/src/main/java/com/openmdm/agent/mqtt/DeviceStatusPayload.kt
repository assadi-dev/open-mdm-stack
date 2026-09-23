package com.openmdm.agent.mqtt

import kotlinx.serialization.Serializable

/**
 * Body published (retained) on `mdm/devices/{id}/status`, both on connect and
 * as the Last Will. Mirrors `deviceStatusSchema` in
 * apps/api/src/features/command/dto/schema.ts.
 */
@Serializable
data class DeviceStatusPayload(val state: String) {
    companion object {
        const val ONLINE = "online"
        const val OFFLINE = "offline"
    }
}
