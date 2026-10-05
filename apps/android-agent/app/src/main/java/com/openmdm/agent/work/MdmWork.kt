package com.openmdm.agent.work

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map

/**
 * Names, input keys and enqueue helpers for the agent's background work.
 */
object MdmWork {
    const val HEARTBEAT_WORK = "mdm_heartbeat"
    const val ENROLL_WORK = "mdm_enroll"

    const val KEY_ENROLLMENT_METHOD = "enrollment_method"
    const val KEY_BASE_URL = "base_url"
    const val KEY_DEVICE_NAME = "device_name"
    const val KEY_SERIAL = "serial"

    /** Values accepted by the server's `device.enrollmentMethod`. */
    const val METHOD_MANUAL = "manual"
    const val METHOD_QR = "qr"
    const val METHOD_USB = "usb"

    private const val HEARTBEAT_INTERVAL_MINUTES = 15L

    private val networkConstraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /**
     * Enqueues a one-off enrollment, used from the device-admin provisioning
     * callback (QR/NFC path) or the dev UI fallback. There is no admin-issued
     * token to carry here: the worker fetches its own single-use challenge
     * from the server right before enrolling (see
     * [com.openmdm.agent.data.repository.DeviceRepository.enroll]) — this
     * only transports the server [baseUrl] (if provisioned), the
     * [enrollmentMethod] to report/sign and the device [name] (if the QR
     * carried one). They travel in the work's input data rather than being
     * read from the provisioning intent later: WorkManager re-runs a retried
     * enrollment with the same input, so the name survives a failed attempt.
     * [serial] is the one a USB enrollment received from ADB (see
     * [com.openmdm.agent.enrollment.UsbEnrollmentHandler]), used only when the
     * device can't read its own.
     */
    fun enqueueEnrollment(
        context: Context,
        baseUrl: String?,
        enrollmentMethod: String = METHOD_MANUAL,
        name: String? = null,
        serial: String? = null,
    ) {
        val request = OneTimeWorkRequestBuilder<EnrollWorker>()
            .setConstraints(networkConstraints)
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .setInputData(
                Data.Builder()
                    .putString(KEY_ENROLLMENT_METHOD, enrollmentMethod)
                    .putString(KEY_BASE_URL, baseUrl)
                    .putString(KEY_DEVICE_NAME, name)
                    .putString(KEY_SERIAL, serial)
                    .build()
            )
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(ENROLL_WORK, ExistingWorkPolicy.REPLACE, request)
    }

    /**
     * Whether the one-off enrollment is running right now, for the screen to say so instead of offering the code.
     * Only `RUNNING` counts: `ENQUEUED` also means "waiting for the network" (see [networkConstraints]) or "waiting for
     * the retry of a failed attempt", and the screen must stay usable then, e.g. with no connection. An enrollment done
     * by hand meanwhile makes the retry a no-op (see [EnrollWorker]).
     */
    fun enrollmentInProgress(context: Context): Flow<Boolean> =
        WorkManager.getInstance(context)
            .getWorkInfosForUniqueWorkFlow(ENROLL_WORK)
            .map { infos -> infos.any { it.state == WorkInfo.State.RUNNING } }
            .distinctUntilChanged()

    /** Schedules the recurring heartbeat (Android's minimum period is 15 min). */
    fun schedulePeriodicHeartbeat(context: Context) {
        val request = PeriodicWorkRequestBuilder<HeartbeatWorker>(
            HEARTBEAT_INTERVAL_MINUTES, TimeUnit.MINUTES,
        )
            .setConstraints(networkConstraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            HEARTBEAT_WORK,
            ExistingPeriodicWorkPolicy.KEEP,
            request,
        )
    }

    /** Runs a heartbeat right now (dev button / immediate check-in). */
    fun enqueueImmediateHeartbeat(context: Context) {
        val request = OneTimeWorkRequestBuilder<HeartbeatWorker>()
            .setConstraints(networkConstraints)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork("${HEARTBEAT_WORK}_now", ExistingWorkPolicy.REPLACE, request)
    }
}
