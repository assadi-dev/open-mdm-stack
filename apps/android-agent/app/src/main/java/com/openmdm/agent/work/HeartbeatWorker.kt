package com.openmdm.agent.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.openmdm.agent.data.repository.DeviceRepository

/**
 * Periodic check-in. No-ops (success) when the device is not enrolled yet so a
 * stale schedule never fails the chain.
 *
 * Reports both the heartbeat and the telemetry snapshot on every run — two
 * independent calls, each caught and logged on its own by
 * [DeviceRepository.sendHeartbeat]/[DeviceRepository.sendTelemetry], so a
 * failure on one doesn't skip the other. The whole run only retries if at
 * least one of them failed.
 */
class HeartbeatWorker(
    context: Context,
    params: WorkerParameters,
    private val repository: DeviceRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        if (!repository.isEnrolled) return Result.success()
        val heartbeat = repository.sendHeartbeat()
        val telemetry = repository.sendTelemetry()
        return if (heartbeat.isSuccess && telemetry.isSuccess) {
            Result.success()
        } else {
            Result.retry()
        }
    }
}
