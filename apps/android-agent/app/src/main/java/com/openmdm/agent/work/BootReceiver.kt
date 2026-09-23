package com.openmdm.agent.work

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.openmdm.agent.MdmAgentApp
import com.openmdm.agent.mqtt.MqttConnectionService

/**
 * Re-arms the periodic heartbeat and the MQTT connection after a reboot, but
 * only for an already enrolled device.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        val container = (context.applicationContext as MdmAgentApp).container
        if (container.deviceRepository.isEnrolled) {
            MdmWork.schedulePeriodicHeartbeat(context.applicationContext)
            MqttConnectionService.start(context.applicationContext)
        }
    }
}
