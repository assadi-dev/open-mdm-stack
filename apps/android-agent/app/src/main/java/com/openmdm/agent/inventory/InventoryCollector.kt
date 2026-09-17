package com.openmdm.agent.inventory

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.Settings
import com.openmdm.agent.data.remote.dto.DeviceInfoDto
import com.openmdm.agent.data.remote.dto.InstalledAppDto
import com.openmdm.agent.data.remote.dto.InventoryRequest
import com.openmdm.agent.data.remote.dto.StorageDto

/**
 * Collects read-only device facts for enrollment and inventory reporting.
 * All privileged reads are guarded so the agent degrades gracefully when a
 * permission is missing (e.g. before the device-owner grant kicks in).
 */
class InventoryCollector(private val context: Context) {

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
            serial = readSerial(),
            publicKey = publicKey,
            enrollmentMethod = enrollmentMethod,
            enrollmentStatus = enrollmentStatus,
            agentPackage = context.packageName,
            agentVersionName = agentPackageInfo?.versionName,
            agentVersionCode = agentPackageInfo?.longVersionCode?.toInt(),
        )
    }

    fun fullInventory(): InventoryRequest {
        val info = deviceInfo()
        return InventoryRequest(
            os = info.osVersion,
            model = info.model,
            manufacturer = info.manufacturer,
            serial = info.serial.orEmpty(),
            storage = readStorage(),
            apps = readInstalledApps(),
        )
    }

    fun batteryLevel(): Int {
        val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        return bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
    }

    private fun isCharging(): Boolean {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        return status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL
    }

    private fun getBatteryHealth(): String? {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        return when (intent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1)) {
            BatteryManager.BATTERY_HEALTH_GOOD -> "good"
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "overheat"
            BatteryManager.BATTERY_HEALTH_DEAD -> "dead"
            BatteryManager.BATTERY_HEALTH_COLD -> "cold"
            else -> "unknown"
        }
    }


    fun freeStorageBytes(): Long = readStorage().freeBytes

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


    private fun getStorageTotal(): Long {
        val stat = StatFs(Environment.getDataDirectory().path)
        return stat.blockCountLong * stat.blockSizeLong
    }

    private fun getFreeStorageBytes(): Long {
        val stat = StatFs(Environment.getDataDirectory().path)
        return stat.availableBlocksLong * stat.blockSizeLong
    }

    private fun getStorageUsed(): Long {
        val total = getStorageTotal()
        val available = getFreeStorageBytes()
        return total - available
    }


    private fun readStorage(): StorageDto {
        val total = getStorageTotal()
        val free = getFreeStorageBytes()
        val used = getStorageUsed()
        return StorageDto(totalBytes = total, freeBytes = free, usedBytes = used)
    }

    @SuppressLint("QueryPermissionsNeeded")
    private fun readInstalledApps(): List<InstalledAppDto> {
        return try {
            val packageManager = context.packageManager
            val packages = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getInstalledPackages(PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getInstalledPackages(0)
            }

            packages.map { packageInfo ->
                val isSystem = (packageInfo.applicationInfo?.flags ?: 0) and ApplicationInfo.FLAG_SYSTEM != 0
                InstalledAppDto(
                    packageName = packageInfo.packageName,
                    // versionName is a free-form string with no platform length
                    // limit, but the server stores it in a varchar(50)
                    // (mdm_device_apps.version in @openmdm/drizzle-adapter) and
                    // rejects the WHOLE heartbeat when any single app exceeds
                    // it — Google's TTS app ships a 53-char versionName in the
                    // wild. Truncate defensively until the server widens the
                    // column.
                    versionName = (packageInfo.versionName ?: "unknown").take(MAX_APP_VERSION_LENGTH),
                    versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        packageInfo.longVersionCode
                    } else {
                        @Suppress("DEPRECATION")
                        packageInfo.versionCode.toLong()
                    },
                    system = isSystem
                )
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    companion object {
        private const val MAX_APP_VERSION_LENGTH = 50
    }
}
