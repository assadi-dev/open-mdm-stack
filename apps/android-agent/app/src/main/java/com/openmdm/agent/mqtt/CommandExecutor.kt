package com.openmdm.agent.mqtt

import com.openmdm.agent.device.DeviceCommandActions
import java.time.Instant
import kotlinx.coroutines.CancellationException
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
class CommandExecutor(
    private val deviceCommands: DeviceCommandActions,
    /**
     * What a `refresh` command asks of the device: push its heartbeat and its telemetry now (see
     * [com.openmdm.agent.data.repository.DeviceRepository.report]). The server only waits for the ack, the data
     * reaches it through the usual endpoints — so the command succeeds only if both pushes did.
     */
    private val report: suspend () -> Result<Unit>,
) {

    /** Result on success is the (possibly empty) JSON object sent back as the ack's `result`. */
    suspend fun execute(command: IncomingCommand): Result<JsonObject> = runCatching {
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
            "refresh" -> {
                report().getOrThrow()
                emptyResult()
            }
            else -> error("Unknown command type: ${command.type}")
        }
    }.onFailure {
        // `runCatching` also catches cancellation: let it through, or the MQTT service could never stop mid-command.
        if (it is CancellationException) throw it
    }

    private fun emptyResult(): JsonObject = buildJsonObject {
        put("executedAt", JsonPrimitive(Instant.now().toString()))
    }
}
