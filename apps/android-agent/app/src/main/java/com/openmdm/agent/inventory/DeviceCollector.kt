package com.openmdm.agent.inventory

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.ContentValues.TAG
import android.content.Context
import com.openmdm.agent.BuildConfig
import com.openmdm.agent.device.MdmDeviceAdminReceiver
import android.provider.Settings
import android.util.Log

class DeviceCollector(context: Context) {


    // TODO before production: this force-enables USB debugging on every
    // QR-provisioned device, which is only acceptable while the fleet is
    // entirely dev/test hardware (see PROVISIONING.md). A real managed
    // fleet should NOT auto-enable ADB. Note this only flips the toggle —
    // the "Allow USB debugging from this computer?" RSA-trust popup still
    // requires a tap on-device, and a factory reset wipes that trust.
    fun enableAdbDebugging(context: Context){
        if (BuildConfig.ENVIRONMENT == "dev") {
            try {
                val dpm = context.getSystemService(DevicePolicyManager::class.java)
                val admin = ComponentName(context, MdmDeviceAdminReceiver::class.java)
                dpm.setGlobalSetting(admin, Settings.Global.ADB_ENABLED, "1")
            } catch (e: SecurityException) {
                Log.w(TAG, "Could not enable ADB via DevicePolicyManager", e)
            }
        }
    }

    /**
     * Silently grants ourselves POST_NOTIFICATIONS (Android 13+ runtime
     * permission) so status notifications (e.g. enrollment success) work
     * without a user prompt — Device Owner is allowed to auto-grant its own
     * app's declared runtime permissions this way.
     */
    fun grantNotificationPermission(context: Context) {
        try {
            val dpm = context.getSystemService(DevicePolicyManager::class.java)
            val admin = ComponentName(context, MdmDeviceAdminReceiver::class.java)
            dpm.setPermissionGrantState(
                admin,
                context.packageName,
                android.Manifest.permission.POST_NOTIFICATIONS,
                DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED,
            )
        } catch (e: SecurityException) {
            Log.w(TAG, "Could not grant POST_NOTIFICATIONS via DevicePolicyManager", e)
        }
    }

}