package com.openmdm.agent.mqtt

import android.app.Activity
import android.app.KeyguardManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log

/**
 * Invisible activity whose only job is asking the system to dismiss the
 * keyguard (see [com.openmdm.agent.device.DeviceOwnerManager.requestUnlock]).
 * `showWhenLocked` + `turnScreenOn` are declared on it in the manifest so it
 * can appear over an active lock screen and wake the display — the
 * recommended way to do this (over calling the equivalent `Activity` methods
 * at startup, which can cause an extra lifecycle hop).
 *
 * On a device with **no secure lock method** (the "None"/"Swipe" screen
 * lock), the keyguard is dismissed immediately with no user interaction. On
 * a **secured** device, Android shows its own credential prompt over this
 * activity instead: the user must authenticate themselves — nothing here
 * bypasses that, by design. Either way, this activity finishes itself once
 * the system reports an outcome (or after [TIMEOUT_MS], as a fallback).
 */
class UnlockActivity : Activity() {

    private val timeoutHandler = Handler(Looper.getMainLooper())
    private val timeoutRunnable = Runnable {
        Log.w(TAG, "No keyguard callback within ${TIMEOUT_MS}ms, finishing anyway")
        finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val keyguardManager = getSystemService(KEYGUARD_SERVICE) as KeyguardManager
        if (!keyguardManager.isKeyguardLocked) {
            finish()
            return
        }

        timeoutHandler.postDelayed(timeoutRunnable, TIMEOUT_MS)
        keyguardManager.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
            override fun onDismissSucceeded() {
                Log.i(TAG, "Keyguard dismissed")
                finishSelf()
            }

            override fun onDismissCancelled() {
                Log.i(TAG, "Keyguard dismiss cancelled by the user")
                finishSelf()
            }

            override fun onDismissError() {
                Log.w(TAG, "Keyguard dismiss error (device likely has a secure lock method)")
                finishSelf()
            }
        })
    }

    override fun onDestroy() {
        timeoutHandler.removeCallbacks(timeoutRunnable)
        super.onDestroy()
    }

    private fun finishSelf() {
        timeoutHandler.removeCallbacks(timeoutRunnable)
        finish()
    }

    private companion object {
        const val TAG = "UnlockActivity"
        const val TIMEOUT_MS = 15_000L
    }
}
