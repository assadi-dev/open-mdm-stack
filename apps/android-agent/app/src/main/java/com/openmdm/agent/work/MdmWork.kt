package com.openmdm.agent.work

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Names, input keys and enqueue helpers for the agent's background work.
 */
object MdmWork {
    const val HEARTBEAT_WORK = "mdm_heartbeat"
    const val ENROLL_WORK = "mdm_enroll"

    const val KEY_ENROLLMENT_TOKEN = "enrollment_token"
    const val KEY_BASE_URL = "base_url"

    private const val HEARTBEAT_INTERVAL_MINUTES = 15L

    private val networkConstraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    /** Enqueues a one-off enrollment, used from the device-admin provisioning callback. */
    fun enqueueEnrollment(context: Context, enrollmentToken: String, baseUrl: String?) {
        val request = OneTimeWorkRequestBuilder<EnrollWorker>()
            .setConstraints(networkConstraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .setInputData(
                Data.Builder()
                    .putString(KEY_ENROLLMENT_TOKEN, enrollmentToken)
                    .putString(KEY_BASE_URL, baseUrl)
                    .build()
            )
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(ENROLL_WORK, ExistingWorkPolicy.REPLACE, request)
    }

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
