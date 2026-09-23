package com.openmdm.agent.mqtt

/**
 * Per-device MQTT topics. Mirrors `mqttTopics` in
 * apps/api/src/lib/mqtt.ts and the ACL in dependencies/emqx/acl.conf: a
 * device may only publish/subscribe under its own `mdm/devices/{id}/#`.
 */
object MqttTopics {
    private const val ROOT = "mdm/devices"

    fun commands(deviceId: String) = "$ROOT/$deviceId/commands"
    fun acks(deviceId: String) = "$ROOT/$deviceId/acks"
    fun status(deviceId: String) = "$ROOT/$deviceId/status"
    fun screen(deviceId: String) = "$ROOT/$deviceId/screen"
}
