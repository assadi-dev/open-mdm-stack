package com.openmdm.agent.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Encrypted persistence for the device identity issued at enrollment
 * (deviceId + device JWT) plus the configured server base URL and enrollment
 * status. Backed by EncryptedSharedPreferences (Android Keystore).
 *
 * Room is intentionally not used in this first cut: the only state to persist
 * is a handful of scalars. A local command queue (the eventual Room use case)
 * is out of scope here.
 */
class SecureDeviceStore(context: Context) {

    private val prefs: SharedPreferences = run {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "mdm_secure_store",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    var deviceId: String?
        get() = prefs.getString(KEY_DEVICE_ID, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var deviceToken: String?
        get() = prefs.getString(KEY_DEVICE_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var serverBaseUrl: String?
        get() = prefs.getString(KEY_BASE_URL, null)
        set(value) = prefs.edit().putString(KEY_BASE_URL, value).apply()

    var lastHeartbeatAt: Long
        get() = prefs.getLong(KEY_LAST_HEARTBEAT, 0L)
        set(value) = prefs.edit().putLong(KEY_LAST_HEARTBEAT, value).apply()

    val isEnrolled: Boolean
        get() = !deviceId.isNullOrBlank() && !deviceToken.isNullOrBlank()

    fun saveEnrollment(deviceId: String, deviceToken: String) {
        prefs.edit()
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_DEVICE_TOKEN, deviceToken)
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val KEY_DEVICE_ID = "device_id"
        const val KEY_DEVICE_TOKEN = "device_token"
        const val KEY_BASE_URL = "server_base_url"
        const val KEY_LAST_HEARTBEAT = "last_heartbeat_at"
    }
}
