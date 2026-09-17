package com.openmdm.agent.inventory

import android.content.Context
import android.content.pm.ApplicationInfo
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
    ): DeviceInfoDto = DeviceInfoDto(
        androidId = readAndroidId(),
        brand = Build.BRAND,
        model = Build.MODEL,
        manufacturer = Build.MANUFACTURER,
        osVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
        serial = readSerial(),
        publicKey = publicKey,
        enrollmentMethod = enrollmentMethod,
        enrollmentStatus = enrollmentStatus,
    )

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

    private fun readStorage(): StorageDto {
        val stat = StatFs(Environment.getDataDirectory().path)
        val total = stat.blockCountLong * stat.blockSizeLong
        val free = stat.availableBlocksLong * stat.blockSizeLong
        return StorageDto(totalBytes = total, freeBytes = free)
    }

    private fun readInstalledApps(): List<InstalledAppDto> = try {
        context.packageManager
            .getInstalledPackages(0)
            .map { pkg ->
                val isSystem = (pkg.applicationInfo?.flags ?: 0) and ApplicationInfo.FLAG_SYSTEM != 0
                InstalledAppDto(
                    packageName = pkg.packageName,
                    versionName = pkg.versionName ?: "",
                    system = isSystem,
                )
            }
    } catch (_: Exception) {
        emptyList()
    }
}
