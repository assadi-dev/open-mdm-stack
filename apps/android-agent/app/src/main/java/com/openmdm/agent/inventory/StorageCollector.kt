package com.openmdm.agent.inventory

import android.annotation.SuppressLint
import android.app.ActivityManager
import android.content.Context
import android.os.Environment
import android.os.StatFs
import com.openmdm.agent.data.remote.dto.MemoryDto
import com.openmdm.agent.data.remote.dto.StorageDto

class StorageCollector(private val context: Context) {


     fun getStorageTotal(): Long {
        val stat = StatFs(Environment.getDataDirectory().path)
        return stat.blockCountLong * stat.blockSizeLong
    }

     fun getFreeStorageBytes(): Long {
        val stat = StatFs(Environment.getDataDirectory().path)
        return stat.availableBlocksLong * stat.blockSizeLong
    }

     fun getStorageUsed(): Long {
        val total = getStorageTotal()
        val available = getFreeStorageBytes()
        return total - available
    }


     fun readStorage(): StorageDto {
        val total = getStorageTotal()
        val free = getFreeStorageBytes()
        val used = getStorageUsed()
        return StorageDto(totalBytes = total, freeBytes = free, usedBytes = used)
    }


     fun getMemoryUsed(): Long {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memInfo)
        return memInfo.totalMem - memInfo.availMem
    }

     fun getMemoryTotal(): Long {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memInfo)
        return memInfo.totalMem
    }

    fun readMemory(): MemoryDto {
        val total = getMemoryTotal()
        val used = getMemoryUsed()
        return MemoryDto(totalBytes = total, usedBytes = used)
    }

}