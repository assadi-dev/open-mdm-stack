package com.openmdm.agent.mqtt

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

/**
 * Reports the device's lock-screen state on `mdm/devices/{id}/screen`
 * whenever it changes — including a manual lock/unlock by the user, not just
 * the outcome of a "lock"/"unlock" command (see [CommandExecutor]). The
 * screen can be ON while still showing the keyguard, so SCREEN_ON/SCREEN_OFF
 * are only used as triggers to re-check [KeyguardManager.isKeyguardLocked],
 * never trusted directly as "unlocked"/"locked". USER_PRESENT is required
 * too, not just SCREEN_ON/OFF: on a device with a real PIN/pattern/password
 * (the realistic case), the actual dismissal happens *between* screen
 * events — SCREEN_ON still finds the keyguard showing, and by the next
 * SCREEN_OFF it's back up regardless — so without USER_PRESENT the
 * "unlocked" state would in practice almost never be observed. USER_PRESENT
 * fires exactly at that dismissal moment.
 *
 * ACTION_SCREEN_ON/OFF/USER_PRESENT are excluded from manifest-declared
 * broadcasts and only reach a receiver registered at runtime, hence
 * [start]/[stop] tied to [MqttConnectionService]'s lifecycle, which already
 * runs for as long as the device is enrolled.
 */
class ScreenLockReporter(
    private val context: Context,
    private val gateway: DeviceMqttGateway,
    private val scope: CoroutineScope,
) {
    private val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    private var lastReported: Boolean? = null
    private var registered = false
    private var connectionJob: Job? = null

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) = report(force = false)
    }

    fun start() {
        if (registered) return
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
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
        val locked = keyguardManager.isKeyguardLocked
        if (!force && locked == lastReported) return
        scope.launch {
            Log.d(TAG, "ScreenLockReporter: Reporting screen state as $locked")
            // Only commit to lastReported once actually published: a silent
            // no-op (e.g. not connected yet) must not be mistaken for
            // success, or the next real change would be deduped away
            // believing it was already sent.
            if (runCatching { gateway.publishScreenState(locked) }.getOrDefault(false)) {
                lastReported = locked
            }
        }
    }

    private companion object {
        const val TAG = "ScreenLockReporter"
    }
}
