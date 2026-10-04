package com.openmdm.agent.data

/**
 * The name an administrator gave the device in the dashboard's enrollment form, carried to the agent by the
 * provisioning QR (`name` in PROVISIONING_ADMIN_EXTRAS_BUNDLE) and sent back with the enrollment request.
 *
 * The QR is an untrusted, free-text input, so it is cleaned up in one place before it leaves the device: a bad value
 * must never make the enrollment fail (a rejected request would be retried forever by
 * [com.openmdm.agent.work.EnrollWorker]), it is better to enroll the device without a name.
 */
object DeviceName {

    /** The server's limit for a device name (`updateDeviceSchema`, `NAME_MAX_LENGTH`). */
    const val MAX_LENGTH = 100

    /**
     * Trims the [raw] name and cuts it to [MAX_LENGTH] characters (without splitting an emoji in two). A blank or
     * missing name is `null`: the server then falls back on the device model.
     */
    fun normalize(raw: String?): String? {
        val trimmed = raw?.trim()?.take(MAX_LENGTH) ?: return null
        val whole = if (trimmed.lastOrNull()?.isHighSurrogate() == true) trimmed.dropLast(1) else trimmed
        return whole.trimEnd().takeIf { it.isNotEmpty() }
    }
}
