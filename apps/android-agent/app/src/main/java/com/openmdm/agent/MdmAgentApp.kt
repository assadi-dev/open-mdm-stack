package com.openmdm.agent

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import androidx.work.Configuration
import android.util.Log
import com.openmdm.agent.di.AppContainer
import com.openmdm.agent.mqtt.MqttConnectionService
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

        // Covers a process restart that isn't a device boot (BootReceiver
        // already handles that one) — e.g. the app being reopened after the
        // system killed it in the background. Device Owner apps are exempt
        // from the background-start restriction this would otherwise hit on
        // Android 12+.
        if (container.deviceRepository.isEnrolled) {
            try {
                MqttConnectionService.start(this)
            } catch (e: Exception) {
                Log.w(TAG, "Could not (re)start MqttConnectionService from Application.onCreate", e)
            }
        }
    }

    companion object {
        private const val TAG = "MdmAgentApp"

        /** Channel for enrollment/heartbeat status notifications (see [com.openmdm.agent.work.EnrollWorker]). */
        const val NOTIFICATION_CHANNEL_ID = "mdm_agent_status"
    }
}
