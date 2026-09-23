package com.openmdm.agent.mqtt

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

/**
 * A command received on `mdm/devices/{id}/commands`. Mirrors the payload the
 * backend publishes (see [CommandService.publish] in
 * apps/api/src/features/command/service.ts): `type` is one of `lock`,
 * `reboot`, `set_lock_message` (see [CommandExecutor]); `payload` only
 * carries fields for the types that need them.
 */
@Serializable
data class IncomingCommand(
    val id: String,
    val type: String,
    val payload: JsonObject = JsonObject(emptyMap()),
    val expiresAt: String? = null,
)
