package com.openmdm.agent

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import androidx.work.Configuration
import com.openmdm.agent.di.AppContainer
import com.openmdm.agent.work.MdmWorkerFactory

/**
 * Application entry point. Owns the manual [AppContainer] and supplies the
 * WorkManager configuration with a [MdmWorkerFactory] so workers receive the
 * shared [com.openmdm.agent.data.repository.DeviceRepository].
 *
 * The default WorkManager initializer is disabled in the manifest so this
 * on-demand configuration is used instead.
 */
class MdmAgentApp : Application(), Configuration.Provider {

    val container: AppContainer by lazy { AppContainer(this) }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(MdmWorkerFactory(container.deviceRepository))
            .build()

    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "Agent status",
            NotificationManager.IMPORTANCE_DEFAULT,
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    companion object {
        /** Channel for enrollment/heartbeat status notifications (see [com.openmdm.agent.work.EnrollWorker]). */
        const val NOTIFICATION_CHANNEL_ID = "mdm_agent_status"
    }
}
