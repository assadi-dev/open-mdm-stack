package com.openmdm.agent.mqtt

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.PowerManager
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

/**
 * Reports the device's screen power state (on/off) on `mdm/devices/{id}/screen`
 * whenever it changes. Driven directly by ACTION_SCREEN_ON/OFF and confirmed
 * with [PowerManager.isInteractive] — this only tracks whether the display is
 * on, not whether the keyguard is showing.
 *
 * ACTION_SCREEN_ON/OFF are excluded from manifest-declared broadcasts and
 * only reach a receiver registered at runtime, hence [start]/[stop] tied to
 * [MqttConnectionService]'s lifecycle, which already runs for as long as the
 * device is enrolled.
 */
class ScreenStateReporter(
    private val context: Context,
    private val gateway: DeviceMqttGateway,
    private val scope: CoroutineScope,
) {
    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    private var lastReported: Boolean? = null
    private var registered = false
    private var connectionJob: Job? = null

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_ON,
                Intent.ACTION_SCREEN_OFF -> report(force = false)
            }
        }
    }

    fun start() {
        if (registered) return
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
        }
        // System-only broadcasts, no other app can send them: NOT_EXPORTED.
        ContextCompat.registerReceiver(context, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
        registered = true

        // Re-asserts the current state on every (re)connect, not just on a
        // change caught by the receiver above — covers the first connect
        // after enrollment/boot and a broker that lost its retained message.
        connectionJob = gateway.connectionState
            .onEach { if (it == MqttConnectionState.CONNECTED) report(force = true) }
            .launchIn(scope)
    }

    fun stop() {
        if (!registered) return
        runCatching { context.unregisterReceiver(receiver) }
            .onFailure { Log.w(TAG, "Failed to unregister screen receiver", it) }
        registered = false
        connectionJob?.cancel()
        connectionJob = null
        lastReported = null
    }

    private fun report(force: Boolean) {
        val on = powerManager.isInteractive

        if (!force && on == lastReported) return
        scope.launch {
            Log.d(TAG, "ScreenStateReporter: Reporting screen state as $on")
            // Only commit to lastReported once actually published: a silent
            // no-op (e.g. not connected yet) must not be mistaken for
            // success, or the next real change would be deduped away
            // believing it was already sent.
            if (runCatching { gateway.publishScreenState(on) }.getOrDefault(false)) {
                lastReported = on
            }
        }
    }

    private companion object {
        const val TAG = "ScreenStateReporter"
    }
}
