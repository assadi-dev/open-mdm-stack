package com.openmdm.agent.work

import android.content.Context
import androidx.work.ListenableWorker
import androidx.work.WorkerFactory
import androidx.work.WorkerParameters
import com.openmdm.agent.data.repository.DeviceRepository

/**
 * Injects the [DeviceRepository] into workers. Replaces the role androidx.hilt
 * hilt-work would have played (Hilt is unavailable on this toolchain).
 */
class MdmWorkerFactory(
    private val repository: DeviceRepository,
) : WorkerFactory() {

    override fun createWorker(
        appContext: Context,
        workerClassName: String,
        workerParameters: WorkerParameters,
    ): ListenableWorker? = when (workerClassName) {
        HeartbeatWorker::class.java.name ->
            HeartbeatWorker(appContext, workerParameters, repository)
        EnrollWorker::class.java.name ->
            EnrollWorker(appContext, workerParameters, repository)
        else -> null
    }
}
