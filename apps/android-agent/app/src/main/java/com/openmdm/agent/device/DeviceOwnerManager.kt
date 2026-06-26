package com.openmdm.agent.device

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context

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
}
