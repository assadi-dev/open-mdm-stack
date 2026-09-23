package com.openmdm.agent.mqtt

import com.openmdm.agent.device.DeviceCommandActions
import java.time.Instant
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull

/**
 * Executes a decoded [IncomingCommand] against [DeviceCommandActions].
 * Mirrors `commandType` in apps/api/src/drizzle/schemas/command-schema.ts —
 * a type this doesn't recognize (e.g. one added server-side but not yet
 * handled here) fails cleanly rather than crashing the MQTT connection.
 */
class CommandExecutor(private val deviceCommands: DeviceCommandActions) {

    /** Result on success is the (possibly empty) JSON object sent back as the ack's `result`. */
    fun execute(command: IncomingCommand): Result<JsonObject> = runCatching {
        when (command.type) {
            "lock" -> {
                deviceCommands.lockNow()
                emptyResult()
            }
            "reboot" -> {
                deviceCommands.reboot()
                emptyResult()
            }
            "unlock" -> {
                deviceCommands.requestUnlock()
                emptyResult()
            }
            "set_lock_message" -> {
                val message = (command.payload["message"] as? JsonPrimitive)?.contentOrNull
                deviceCommands.setLockScreenMessage(message)
                emptyResult()
            }
            "remove_device_owner" -> {
                deviceCommands.removeDeviceOwner()
                emptyResult()
            }
            else -> error("Unknown command type: ${command.type}")
        }
    }

    private fun emptyResult(): JsonObject = buildJsonObject {
        put("executedAt", JsonPrimitive(Instant.now().toString()))
    }
}
