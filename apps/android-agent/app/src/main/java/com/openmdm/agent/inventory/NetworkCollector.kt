package com.openmdm.agent.inventory

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.telephony.TelephonyManager
import com.openmdm.agent.data.remote.dto.LocationDto
import com.openmdm.agent.data.remote.dto.NetworkDto
import java.net.NetworkInterface

class NetworkCollector(private val context: Context) {

     fun getMacAddress(): String? {
        return try {
            NetworkInterface.getNetworkInterfaces()?.toList()
                ?.find { it.name.equals("wlan0", ignoreCase = true) }
                ?.hardwareAddress
                ?.joinToString(":") { String.format("%02X", it) }
        } catch (e: Exception) {
            null
        }
    }


    @SuppressLint("MissingPermission", "ServiceCast")
    private fun getNetworkName(): String? {
        return try {
            when (getNetworkType()) {
                "wifi" -> {
                    val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                    wifiManager.connectionInfo?.ssid?.removeSurrounding("\"")
                }

                "cellular" -> {
                    val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                    telephonyManager.networkOperatorName
                }

                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }

    @SuppressLint("ServiceCast")
     fun getNetworkType(): String? {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return "none"
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return "none"

        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            else -> "unknown"
        }
    }


    private fun getIpAddress(): String? {
        return try {
            NetworkInterface.getNetworkInterfaces()?.toList()
                ?.flatMap { it.inetAddresses.toList() }
                ?.firstOrNull { !it.isLoopbackAddress && it.hostAddress?.contains(':') == false }
                ?.hostAddress
        } catch (e: Exception) {
            null
        }
    }

    @SuppressLint("MissingPermission", "ServiceCast")
     fun getLocation(): LocationDto? {
        return try {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

            val location: Location? = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

            location?.let {
                LocationDto(it.latitude, it.longitude, it.accuracy)
            }
        } catch (e: Exception) {
            null
        }
    }


    fun readNetworkInfo(): NetworkDto {
        val networkName = getNetworkName() ?: "unknown"
        val networkType = getNetworkType() ?: "unknown"
        val macAddress = getMacAddress() ?: "unknown"
        val ipAddress = getIpAddress() ?: "0.0.0.0"
        return NetworkDto(networkType, networkName, ipAddress, macAddress)
    }


    fun readLocation(): LocationDto {
       try {
           return getLocation() ?: LocationDto(0.0, 0.0, 0.0f)
       }catch (e: Exception){
           return LocationDto(0.0, 0.0, 0.0f)
       }
    }




}