package com.openmdm.agent.device

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.os.PersistableBundle
import android.util.Log
import android.widget.Toast
import com.openmdm.agent.work.MdmWork

/**
 * Device-admin / Device Owner entry point.
 *
 * For QR (or NFC) provisioning, the management server embeds an admin-extras
 * bundle in the QR JSON under PROVISIONING_ADMIN_EXTRAS_BUNDLE carrying the
 * enrollment token + server URL; it is delivered here in
 * [onProfileProvisioningComplete] once the app becomes Device Owner.
 *
 * For the ADB dev path (`adb shell dpm set-device-owner ...`) no extras are
 * delivered — enrollment is then driven manually from the UI fallback screen.
 */
class MdmDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        Log.i(TAG, "Device admin enabled")
        Toast.makeText(context, "MDM admin enabled", Toast.LENGTH_SHORT).show()
    }

    override fun onDisabled(context: Context, intent: Intent) {
        Log.i(TAG, "Device admin disabled")
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        Log.i(TAG, "Provisioning complete")
        val extras: PersistableBundle? =
            intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE)
        val token = extras?.getString(EXTRA_ENROLLMENT_TOKEN)
        val baseUrl = extras?.getString(EXTRA_SERVER_BASE_URL)

        if (token.isNullOrBlank()) {
            Log.w(TAG, "No enrollment token in provisioning extras; awaiting manual enrollment")
            return
        }
        MdmWork.enqueueEnrollment(context.applicationContext, token, baseUrl)
    }

    companion object {
        private const val TAG = "MdmDeviceAdmin"

        /** Keys expected inside PROVISIONING_ADMIN_EXTRAS_BUNDLE. */
        const val EXTRA_ENROLLMENT_TOKEN = "enrollmentToken"
        const val EXTRA_SERVER_BASE_URL = "serverBaseUrl"
    }
}
