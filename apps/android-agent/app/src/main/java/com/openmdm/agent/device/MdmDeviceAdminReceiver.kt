package com.openmdm.agent.device

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.os.PersistableBundle
import android.util.Log
import android.widget.Toast
import com.openmdm.agent.MainActivity
import com.openmdm.agent.work.MdmWork

/**
 * Device-admin / Device Owner entry point.
 *
 * For QR (or NFC) provisioning, the management server embeds an admin-extras
 * bundle in the QR JSON under PROVISIONING_ADMIN_EXTRAS_BUNDLE carrying a
 * `challenge` + `serverBaseUrl` (see
 * apps/api/src/features/enrollment/utils/generators.ts#buildProvisioningPayload),
 * delivered here in [onProfileProvisioningComplete] once the app becomes
 * Device Owner. The embedded `challenge` is deliberately NOT used: it is
 * short-lived (120s by default) and provisioning (wipe + DPC install + boot)
 * can easily outlast that TTL, so it would likely already be expired or
 * consumed by the time the agent starts. Only `serverBaseUrl` is read from
 * the extras; [MdmWork.enqueueEnrollment] fetches a fresh challenge itself
 * right before enrolling, exactly like the manual UI path.
 *
 * For the ADB dev path (`adb shell dpm set-device-owner ...`) no extras are
 * delivered; enrollment then falls back to the configured default server URL
 * (see di/AppContainer.kt), still driven through the same self-service
 * challenge handshake — no separate manual UI step is required.
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

        // Keep this callback fast: it's a BroadcastReceiver entry point with a
        // strict ANR watchdog, and the device is typically under heavy system
        // load right as provisioning finishes (setup wizard, Knox, GMS all
        // finalizing at once). DevicePolicyManager Binder calls (ADB-enable,
        // notification-permission grant) are deferred into EnrollWorker,
        // which runs on a background dispatcher with no such deadline — do
        // NOT call DeviceCollector's DPM methods synchronously here again.
        val extras: PersistableBundle? =
            intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE)
        val baseUrl = extras?.getString(EXTRA_SERVER_BASE_URL)

        MdmWork.enqueueEnrollment(context.applicationContext, baseUrl, MdmWork.METHOD_QR)

    }

    companion object {
        private const val TAG = "MdmDeviceAdmin"

        /** Key expected inside PROVISIONING_ADMIN_EXTRAS_BUNDLE. */
        const val EXTRA_SERVER_BASE_URL = "serverBaseUrl"
    }
}
