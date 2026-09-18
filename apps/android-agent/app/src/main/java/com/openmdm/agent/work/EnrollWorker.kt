package com.openmdm.agent.work

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.openmdm.agent.MdmAgentApp
import com.openmdm.agent.R
import com.openmdm.agent.data.repository.DeviceRepository
import com.openmdm.agent.inventory.DeviceCollector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * One-off enrollment triggered from the device-admin provisioning callback (or
 * the dev fallback screen). On success it arms the periodic heartbeat.
 */
class EnrollWorker(
    private val appContext: Context,
    params: WorkerParameters,
    private val repository: DeviceRepository,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        // Device Owner DevicePolicyManager Binder calls — deliberately NOT
        // called from MdmDeviceAdminReceiver.onProfileProvisioningComplete
        // (a BroadcastReceiver entry point with a strict ANR deadline); here
        // they run on this worker's background dispatcher instead, with no
        // such deadline. Idempotent, safe to run on every worker execution.
        val deviceCollector = DeviceCollector(appContext)
        deviceCollector.enableAdbDebugging(appContext)
        deviceCollector.grantNotificationPermission(appContext)

        if (repository.isEnrolled) {
            MdmWork.schedulePeriodicHeartbeat(appContext)
            return Result.success()
        }
        val baseUrl = inputData.getString(MdmWork.KEY_BASE_URL)
        val enrollmentMethod = inputData.getString(MdmWork.KEY_ENROLLMENT_METHOD)
            ?: MdmWork.METHOD_MANUAL

        return repository.enroll(baseUrl, enrollmentMethod).fold(
            onSuccess = {
                MdmWork.schedulePeriodicHeartbeat(appContext)
                Result.success()
            },
            onFailure = { Result.retry() },
        )
    }

    /**
     * Toast + status-bar notification, both work with no Activity launched
     * (e.g. right after QR provisioning, before the app is ever opened). The
     * notification is a persistent complement to the fleeting toast — it
     * needs POST_NOTIFICATIONS, silently granted to ourselves as Device Owner
     * in [com.openmdm.agent.inventory.DeviceCollector.grantNotificationPermission];
     * skipped gracefully if that grant hasn't happened (e.g. ADB dev path).
     */
    private suspend fun notifyEnrollmentSuccess() {
        // doWork() runs on Dispatchers.Default — Toast requires the main thread.
        withContext(Dispatchers.Main) {
            Toast.makeText(appContext, "Device enrolled", Toast.LENGTH_LONG).show()
        }

        if (ContextCompat.checkSelfPermission(appContext, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        val notification = NotificationCompat.Builder(appContext, MdmAgentApp.NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(appContext.getString(R.string.app_name))
            .setContentText("Device enrolled successfully")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(appContext).notify(ENROLLMENT_NOTIFICATION_ID, notification)
    }

    companion object {
        private const val ENROLLMENT_NOTIFICATION_ID = 1001
    }
}
