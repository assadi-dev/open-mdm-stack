package com.openmdm.agent.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.openmdm.agent.data.repository.DeviceRepository

/**
 * Periodic check-in. No-ops (success) when the device is not enrolled yet so a
 * stale schedule never fails the chain.
 */
class HeartbeatWorker(
    context: Context,
    params: WorkerParameters,
    private val repository: DeviceRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        if (!repository.isEnrolled) return Result.success()
        return repository.sendHeartbeat().fold(
            onSuccess = { Result.success() },
            onFailure = { Result.retry() },
        )
    }
}
