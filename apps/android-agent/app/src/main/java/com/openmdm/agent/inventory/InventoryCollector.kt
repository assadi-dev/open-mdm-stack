package com.openmdm.agent.inventory

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.telephony.TelephonyManager
import com.openmdm.agent.data.remote.dto.DeviceInfoDto
import com.openmdm.agent.data.remote.dto.InventoryRequest

/**
 * Collects read-only device facts for enrollment and inventory reporting.
 * All privileged reads are guarded so the agent degrades gracefully when a
 * permission is missing (e.g. before the device-owner grant kicks in).
 */
class InventoryCollector(private val context: Context) {

    lateinit var storageInventory: StorageCollector
    lateinit var appInventory: PackageCollector
    lateinit var networkInventory: NetworkCollector

    lateinit var batteryInventory: PowerCollector


    init {
        storageInventory = StorageCollector(context)
        appInventory = PackageCollector(context)
        networkInventory = NetworkCollector(context)
        batteryInventory = PowerCollector(context)

    }

    /**
     * Device facts only — [publicKey]/[enrollmentMethod]/[enrollmentStatus]
     * are not facts this collector can know on its own; callers that build
     * the enrollment request (see
     * [com.openmdm.agent.data.repository.DeviceRepository.enroll]) pass them
     * in explicitly. Callers that only need the facts for display or
     * inventory derivation use the defaults.
     */
    fun deviceInfo(
        publicKey: String = "",
        enrollmentMethod: String? = null,
        enrollmentStatus: String? = null,
    ): DeviceInfoDto {
        val agentPackageInfo = readAgentPackageInfo()
        return DeviceInfoDto(
            androidId = readAndroidId(),
            brand = Build.BRAND,
            model = Build.MODEL,
            manufacturer = Build.MANUFACTURER,
            osVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
            release = Build.VERSION.RELEASE,
            sdkVersion = Build.VERSION.SDK_INT,
            serial = readSerial(),
            publicKey = publicKey,
            enrollmentMethod = enrollmentMethod,
            enrollmentStatus = enrollmentStatus,
            agentPackage = context.packageName,
            agentVersionName = agentPackageInfo?.versionName,
            agentVersionCode = agentPackageInfo?.longVersionCode?.toInt(),
        )
    }

    /** Current screen power state — same signal as [com.openmdm.agent.mqtt.ScreenStateReporter]. */
    fun isScreenOn(): Boolean =
        (context.getSystemService(Context.POWER_SERVICE) as PowerManager).isInteractive

    fun fullInventory(): InventoryRequest {
        val info = deviceInfo()

        return InventoryRequest(
            brand = info.brand,
            os = info.osVersion,
            model = info.model,
            manufacturer = info.manufacturer,
            serial = info.serial.orEmpty(),
            storage = storageInventory.readStorage(),
            apps = appInventory.readInstalledApps(),
            network = networkInventory.readNetworkInfo(),
            memory = storageInventory.readMemory(),
            battery = batteryInventory.readBatteryStatus(),
            locations = networkInventory.readLocation(),
        )
    }


    private fun readSerial(): String = try {
        // Build.getSerial() requires READ_PHONE_STATE or device-owner privilege.
        @Suppress("HardwareIds")
        Build.getSerial()
    } catch (_: SecurityException) {
        Build.UNKNOWN
    } catch (_: Exception) {
        Build.UNKNOWN
    }

    /**
     * 64-bit hex string, unique per app-signing-key/user/device — used as the
     * key-pinning identity by the server (see DeviceKeyStore). Optional on
     * the wire; tolerate it being unreadable rather than failing enrollment.
     */
    private fun readAndroidId(): String? = try {
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            ?.takeIf { it.isNotBlank() }
    } catch (_: Exception) {
        null
    }


    /** The agent's own package info (name/versionName/versionCode) — static per install, always readable. */
    private fun readAgentPackageInfo(): PackageInfo? = try {
        context.packageManager.getPackageInfo(context.packageName, 0)
    } catch (_: PackageManager.NameNotFoundException) {
        null
    }


    @SuppressLint("HardwareIds", "MissingPermission", "ServiceCast")
    private fun getImei(): String? {
        return try {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                null // IMEI is not accessible on Android 10+
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.deviceId
            }
        } catch (e: Exception) {
            null
        }
    }

    @SuppressLint("HardwareIds")
    private fun getSerialNumber(): String? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                null // Serial is not accessible on Android 10+
            } else {
                @Suppress("DEPRECATION")
                Build.SERIAL
            }
        } catch (e: Exception) {
            null
        }
    }


}
