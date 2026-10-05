package com.openmdm.agent.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.conflate

/**
 * Encrypted persistence for the device identity issued at enrollment
 * (deviceId + device JWT) plus the configured server base URL, the device
 * name received from the provisioning QR (if any) and enrollment status. Backed by EncryptedSharedPreferences (Android Keystore).
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

    /**
     * Emits each time something is saved here, whoever saves it: the screen follows an enrollment that finishes in the
     * background (USB `autoEnroll`, provisioning QR, see [com.openmdm.agent.work.EnrollWorker]) without having started
     * it. Conflated: a burst of writes (the token, then the name…) is one refresh.
     */
    val changes: Flow<Unit> = callbackFlow {
        // SharedPreferences only holds its listeners weakly: this one lives as long as the flow is collected.
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> trySend(Unit) }
        prefs.registerOnSharedPreferenceChangeListener(listener)
        awaitClose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
    }.conflate()

    var deviceId: String?
        get() = prefs.getString(KEY_DEVICE_ID, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var deviceToken: String?
        get() = prefs.getString(KEY_DEVICE_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var serverBaseUrl: String?
        get() = prefs.getString(KEY_BASE_URL, null)
        set(value) = prefs.edit().putString(KEY_BASE_URL, value).apply()

    /**
     * The name the administrator gave this device in the dashboard. Received
     * from the provisioning QR, it is saved once the enrollment succeeded;
     * received from a USB enrollment, as soon as it arrives (see
     * [com.openmdm.agent.enrollment.UsbEnrollmentHandler]), like the group and
     * the policy. `null` when none was received (the UI then shows nothing).
     * Not a secret, kept here with the rest of the device's identity.
     */
    var deviceName: String?
        get() = prefs.getString(KEY_DEVICE_NAME, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_NAME, value).apply()

    /**
     * The group and the policy an administrator chose in the dashboard for a USB enrollment (see
     * [com.openmdm.agent.enrollment.UsbEnrollmentHandler]). The server has neither yet, so they are only kept here,
     * ready to be sent or applied once it does. `null` until a USB enrollment carries them.
     */
    var groupId: String?
        get() = prefs.getString(KEY_GROUP_ID, null)
        set(value) = prefs.edit().putString(KEY_GROUP_ID, value).apply()

    var policyId: String?
        get() = prefs.getString(KEY_POLICY_ID, null)
        set(value) = prefs.edit().putString(KEY_POLICY_ID, value).apply()

    /**
     * What a USB enrollment started without `autoEnroll` leaves for the enrollment with a code that follows (see
     * [com.openmdm.agent.ui.AgentViewModel.enroll]): the serial ADB sees the device under, if one was received, and
     * whether the agent was started that way at all (the enrollment is then reported as `usb`). Both are cleared once
     * an enrollment succeeds.
     */
    var usbSerial: String?
        get() = prefs.getString(KEY_USB_SERIAL, null)
        set(value) = prefs.edit().putString(KEY_USB_SERIAL, value).apply()

    var usbEnrollmentPending: Boolean
        get() = prefs.getBoolean(KEY_USB_ENROLLMENT_PENDING, false)
        set(value) = prefs.edit().putBoolean(KEY_USB_ENROLLMENT_PENDING, value).apply()

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
        const val KEY_DEVICE_NAME = "device_name"
        const val KEY_GROUP_ID = "group_id"
        const val KEY_POLICY_ID = "policy_id"
        const val KEY_USB_SERIAL = "usb_serial"
        const val KEY_USB_ENROLLMENT_PENDING = "usb_enrollment_pending"
        const val KEY_LAST_HEARTBEAT = "last_heartbeat_at"
    }
}
