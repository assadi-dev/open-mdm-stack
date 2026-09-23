package com.openmdm.agent.mqtt

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.openmdm.agent.MdmAgentApp
import com.openmdm.agent.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Keeps the MQTT connection (see [DeviceMqttGateway]) alive for as long as
 * the device is enrolled, so presence and (later) commands work without
 * relying on FCM. Foreground + `remoteMessaging` type: the Android 14+
 * category for "maintain a connection to receive messages over the network,
 * beyond the lifetime of an activity" — exactly this use case.
 *
 * Started after enrollment ([com.openmdm.agent.work.EnrollWorker]), after
 * boot for an already-enrolled device ([com.openmdm.agent.work.BootReceiver]),
 * and from [MdmAgentApp] in case the process was restarted some other way
 * (e.g. the user reopening the app after it was killed in the background).
 */
class MqttConnectionService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var connectJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        // Two-arg overload: the foreground service type is read from the
        // static `remoteMessaging` declaration on this service in the
        // manifest — nothing else is declared there, so there's no
        // ambiguity to resolve at the call site.
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val container = (application as MdmAgentApp).container
        if (!container.deviceRepository.isEnrolled) {
            stopSelf()
            return START_NOT_STICKY
        }

        if (connectJob?.isActive != true) {
            connectJob = scope.launch {
                try {
                    container.mqttGateway.connect()
                } catch (e: Exception) {
                    Log.e(TAG, "MQTT connection failed, will retry via automaticReconnect", e)
                }
            }
        }
        // Restarted by the system after being killed for resources (not a
        // user-initiated swipe-away); the device should reconnect on its own.
        return START_STICKY
    }

    override fun onDestroy() {
        val container = (application as MdmAgentApp).container
        // Best-effort: publishes a retained "offline" before disconnecting.
        // If the process is killed outright instead, the broker's Last Will
        // (registered in DeviceMqttGateway.connect) does this for us.
        scope.launch { container.mqttGateway.disconnect() }
        connectJob?.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification() =
        NotificationCompat.Builder(this, MdmAgentApp.NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(getString(R.string.app_name))
            .setContentText("Connecté au serveur MDM")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

    companion object {
        private const val TAG = "MqttConnectionService"
        private const val NOTIFICATION_ID = 2001

        fun start(context: Context) {
            val intent = Intent(context, MqttConnectionService::class.java)
            ContextCompat.startForegroundService(context, intent)
        }
    }
}
