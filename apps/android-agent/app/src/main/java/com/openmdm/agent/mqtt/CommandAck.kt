package com.openmdm.agent.mqtt

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

/**
 * Published on `mdm/devices/{id}/acks`. Mirrors `commandAckSchema` in
 * apps/api/src/features/command/dto/schema.ts. `result`/`error` are left
 * null (omitted from the encoded JSON, not sent as explicit `null` — see
 * [AppContainer]'s `json` for why that distinction matters to the server's
 * zod validation) unless relevant to [status].
 */
@Serializable
data class CommandAck(
    val commandId: String,
    val status: String,
    val result: JsonObject? = null,
    val error: String? = null,
)
