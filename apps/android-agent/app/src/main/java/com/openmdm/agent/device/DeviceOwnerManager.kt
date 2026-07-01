package com.openmdm.agent.device

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.util.Log

/**
 * Thin wrapper around [DevicePolicyManager] exposing the admin/owner status the
 * UI needs. Policy enforcement and remote commands (lock/wipe/...) are out of
 * scope for this first cut but will hang off this component.
 */
class DeviceOwnerManager(private val context: Context) {

    private val dpm: DevicePolicyManager =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    val adminComponent: ComponentName =
        ComponentName(context, MdmDeviceAdminReceiver::class.java)

    val isDeviceOwner: Boolean
        get() = dpm.isDeviceOwnerApp(context.packageName)

    val isAdminActive: Boolean
        get() = dpm.isAdminActive(adminComponent)

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
