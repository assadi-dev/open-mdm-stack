package com.openmdm.agent.device

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import com.openmdm.agent.BuildConfig

/**
 * Debug-only helper to drive the agent from ADB during development, e.g. to
 * relinquish Device Owner (which cannot be done with `adb dpm
 * remove-active-admin` for a non-test owner):
 *
 *   adb shell am broadcast -a com.openmdm.agent.CLEAR_DEVICE_OWNER \
 *     -n com.openmdm.agent/.device.DevCommandReceiver
 *
 * Inert in release builds. Remove before shipping a production agent.
 */
class DevCommandReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!BuildConfig.DEBUG) return
        when (intent.action) {
            ACTION_CLEAR_DEVICE_OWNER -> {
                val ok = DeviceOwnerManager(context).clearDeviceOwner()
                Log.i(TAG, "CLEAR_DEVICE_OWNER -> $ok")
                Toast.makeText(
                    context,
                    if (ok) "Device owner removed" else "Failed to remove device owner",
                    Toast.LENGTH_LONG,
                ).show()
            }
        }
    }

    companion object {
        private const val TAG = "DevCommandReceiver"
        const val ACTION_CLEAR_DEVICE_OWNER = "com.openmdm.agent.CLEAR_DEVICE_OWNER"
    }
}
