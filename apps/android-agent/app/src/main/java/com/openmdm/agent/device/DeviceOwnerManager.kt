package com.openmdm.agent.device

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.openmdm.agent.mqtt.UnlockActivity

/**
 * Thin wrapper around [DevicePolicyManager] exposing the admin/owner status
 * the UI needs, plus the remote commands executed from MQTT (see
 * [com.openmdm.agent.mqtt.CommandExecutor]). The [DeviceCommandActions] ones
 * require Device Owner and throw [SecurityException] otherwise — left
 * uncaught here so the caller's own error handling (the command's ack)
 * surfaces the failure.
 */
class DeviceOwnerManager(private val context: Context) : DeviceCommandActions {

    private val dpm: DevicePolicyManager =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    val adminComponent: ComponentName =
        ComponentName(context, MdmDeviceAdminReceiver::class.java)

    val isDeviceOwner: Boolean
        get() = dpm.isDeviceOwnerApp(context.packageName)

    val isAdminActive: Boolean
        get() = dpm.isAdminActive(adminComponent)

    /** Locks the screen immediately, as if the power button had been pressed. */
    override fun lockNow() {
        Log.i(TAG, "Executing lockNow")
        dpm.lockNow()
    }

    /** Reboots the device outright — no confirmation, no grace period. */
    override fun reboot() {
        Log.i(TAG, "Executing reboot")
        dpm.reboot(adminComponent)
    }

    /**
     * Sets (or clears, passing `null`/blank) the message shown on the lock
     * screen — e.g. "Property of ACME, call +33...". Once set by a Device
     * Owner the user can no longer edit or clear it from Settings themselves.
     */
    override fun setLockScreenMessage(message: String?) {
        Log.i(TAG, "Setting lock screen message: $message")
        dpm.setDeviceOwnerLockScreenInfo(adminComponent, message?.takeIf { it.isNotBlank() })
    }

    /**
     * Best-effort request to exit the current lock screen (see
     * [UnlockActivity]): launches a transient activity that asks
     * [android.app.KeyguardManager] to dismiss the keyguard. Android never
     * lets any admin — Device Owner included — bypass a *secure* lock screen
     * (PIN/pattern/password/biometric); this only has a visible, silent
     * effect when the device has no secure lock method configured. On a
     * secured device it still wakes the screen, but the system shows its own
     * credential prompt and the user has to authenticate themselves.
     */
    override fun requestUnlock() {
        Log.i(TAG, "Requesting keyguard dismissal")
        val intent = Intent(context, UnlockActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    /**
     * Relinquishes Device Owner. A non-test Device Owner cannot be removed via
     * `adb dpm remove-active-admin`; only the owner app itself can step down.
     */
    fun clearDeviceOwner(): Boolean = try {
        if (dpm.isDeviceOwnerApp(context.packageName)) {
            @Suppress("DEPRECATION")
            dpm.clearDeviceOwnerApp(context.packageName)
        }
        Log.i(TAG, "Device owner cleared")
        true
    } catch (e: Exception) {
        Log.e(TAG, "Failed to clear device owner", e)
        false
    }

    private companion object {
        const val TAG = "DeviceOwnerManager"
    }
}
