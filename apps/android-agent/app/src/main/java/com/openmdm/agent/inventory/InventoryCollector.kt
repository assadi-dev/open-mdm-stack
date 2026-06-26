package com.openmdm.agent.inventory

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
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

    fun deviceInfo(): DeviceInfoDto = DeviceInfoDto(
        model = Build.MODEL,
        manufacturer = Build.MANUFACTURER,
        osVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
        serial = readSerial(),
    )

    fun fullInventory(): InventoryRequest {
        val info = deviceInfo()
        return InventoryRequest(
            os = info.osVersion,
            model = info.model,
            manufacturer = info.manufacturer,
            serial = info.serial,
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
