package com.openmdm.agent.enrollment

import android.content.Intent
import com.openmdm.agent.data.DeviceName

/**
 * The parameters the dashboard sends when it starts the agent over ADB, for the « Connexion USB » enrollment
 * (apps/web/app/(dashboard)/enrollment/_services/enrollment.api.ts#enrollUsbDeviceApi, reproduced by
 * scripts/usb-enroll.sh):
 *
 *     am start-activity -W -S -n com.openmdm.agent/com.openmdm.agent.MainActivity \
 *         --es deviceName <name> --es groupId <id> --es policyId <id> --es serial <serial> --ez autoEnroll true
 *
 * Every value comes from an untrusted command line, so each one is read and checked on its own (see [parse]): a bad
 * value is dropped and reported in [rejected], it never stops the others from being used.
 */
data class UsbEnrollmentArgs(
    /** The name typed in the dashboard, cleaned up by [DeviceName.normalize]; `null` when there is none. */
    val deviceName: String?,
    /** The group chosen in the dashboard. The server has no groups yet: the agent only keeps it. */
    val groupId: String?,
    /** The policy chosen in the dashboard. The server has no policies yet: the agent only keeps it. */
    val policyId: String?,
    /** The serial ADB sees the device under, used when the device can't read its own (Android 10+, no Device Owner). */
    val serial: String?,
    /** Whether the agent enrolls by itself right away. Absent, it doesn't: the person enrolls from the screen. */
    val autoEnroll: Boolean,
    /** The extras that were present but held an unusable value, by name. */
    val rejected: List<String> = emptyList(),
) {

    companion object {
        const val EXTRA_DEVICE_NAME = "deviceName"
        const val EXTRA_GROUP_ID = "groupId"
        const val EXTRA_POLICY_ID = "policyId"
        const val EXTRA_SERIAL = "serial"
        const val EXTRA_AUTO_ENROLL = "autoEnroll"

        private val KEYS = listOf(EXTRA_DEVICE_NAME, EXTRA_GROUP_ID, EXTRA_POLICY_ID, EXTRA_SERIAL, EXTRA_AUTO_ENROLL)

        /** Ids sent by the dashboard: slugs today (`lyon`, `std`), UUIDs once the server has groups and policies. */
        private val IDENTIFIER = Regex("[A-Za-z0-9._:-]{1,64}")

        /** A serial as ADB reports it (`3A1B7K2P`, `emulator-5554`, `192.168.1.20:5555` over Wi-Fi). */
        private val SERIAL = Regex("[A-Za-z0-9._:-]{1,64}")

        /** The parameters of [intent], or `null` when it carries none of them (a normal start from the launcher). */
        fun from(intent: Intent?): UsbEnrollmentArgs? {
            val extras = intent?.extras ?: return null
            @Suppress("DEPRECATION") // Bundle.get(key): the only way to read a value whatever its type.
            return parse { key -> if (extras.containsKey(key)) extras.get(key) else null }
        }

        /**
         * Reads each parameter from [extra] (`null` when absent), one after the other. Pure, so it can be tested
         * without Android: [from] only adapts the intent's extras to it.
         */
        fun parse(extra: (String) -> Any?): UsbEnrollmentArgs? {
            if (KEYS.none { extra(it) != null }) return null

            val rejected = mutableListOf<String>()
            fun <T> read(key: String, decode: (Any) -> T?): T? {
                val raw = extra(key) ?: return null
                return decode(raw).also { if (it == null) rejected += key }
            }

            return UsbEnrollmentArgs(
                // A blank name is no name (the server falls back on the model), not an error.
                deviceName = read(EXTRA_DEVICE_NAME) { raw -> (raw as? String)?.let { DeviceName.normalize(it) ?: "" } }
                    ?.takeIf { it.isNotEmpty() },
                groupId = read(EXTRA_GROUP_ID) { raw -> (raw as? String)?.trim()?.takeIf(IDENTIFIER::matches) },
                policyId = read(EXTRA_POLICY_ID) { raw -> (raw as? String)?.trim()?.takeIf(IDENTIFIER::matches) },
                serial = read(EXTRA_SERIAL) { raw -> (raw as? String)?.trim()?.takeIf(SERIAL::matches) },
                // `--ez autoEnroll true` gives a Boolean; `--es autoEnroll true` (a typo on the command line) a String.
                autoEnroll = read(EXTRA_AUTO_ENROLL) { raw ->
                    when (raw) {
                        is Boolean -> raw
                        is String -> raw.trim().lowercase().toBooleanStrictOrNull()
                        else -> null
                    }
                } ?: false,
                rejected = rejected,
            )
        }
    }
}
