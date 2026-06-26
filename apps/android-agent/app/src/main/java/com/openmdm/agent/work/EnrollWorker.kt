package com.openmdm.agent.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.openmdm.agent.data.repository.DeviceRepository

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
        if (repository.isEnrolled) {
            MdmWork.schedulePeriodicHeartbeat(appContext)
            return Result.success()
        }
        val token = inputData.getString(MdmWork.KEY_ENROLLMENT_TOKEN)
            ?: return Result.failure()
        val baseUrl = inputData.getString(MdmWork.KEY_BASE_URL)

        return repository.enroll(token, baseUrl).fold(
            onSuccess = {
                MdmWork.schedulePeriodicHeartbeat(appContext)
                Result.success()
            },
            onFailure = { Result.retry() },
        )
    }
}
