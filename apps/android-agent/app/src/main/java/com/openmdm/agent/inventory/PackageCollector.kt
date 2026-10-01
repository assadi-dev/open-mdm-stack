package com.openmdm.agent.inventory

import android.content.Context
import com.openmdm.agent.data.remote.dto.InstalledAppDto
import android.annotation.SuppressLint
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build

class PackageCollector(private val context: Context) {



    
    private fun getRunningApps(): List<String>? {
        // Requires PACKAGE_USAGE_STATS permission
        return null
    }

    @SuppressLint("QueryPermissionsNeeded")
     fun readInstalledApps(): List<InstalledAppDto> {
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