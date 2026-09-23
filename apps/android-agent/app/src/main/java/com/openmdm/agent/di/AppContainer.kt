package com.openmdm.agent.di

import android.content.Context
import com.openmdm.agent.BuildConfig
import com.openmdm.agent.data.local.DeviceKeyStore
import com.openmdm.agent.data.local.SecureDeviceStore
import com.openmdm.agent.data.remote.AuthInterceptor
import com.openmdm.agent.data.remote.DeviceApi
import com.openmdm.agent.data.remote.MockDeviceApi
import com.openmdm.agent.data.repository.DeviceRepository
import com.openmdm.agent.device.DeviceOwnerManager
import com.openmdm.agent.inventory.InventoryCollector
import com.openmdm.agent.mqtt.DeviceMqttGateway
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.Retrofit

/**
 * Manual dependency container, held by [com.openmdm.agent.MdmAgentApp].
 *
 * Hilt was the original plan but its Gradle plugin is incompatible with the
 * AGP 9 built-in-Kotlin toolchain used here, so DI is wired by hand. For an
 * agent of this size a single container is more than enough.
 */
class AppContainer(private val appContext: Context) {

    val secureStore: SecureDeviceStore by lazy { SecureDeviceStore(appContext) }

    val deviceKeyStore: DeviceKeyStore by lazy { DeviceKeyStore() }

    val deviceOwnerManager: DeviceOwnerManager by lazy { DeviceOwnerManager(appContext) }

    val mqttGateway: DeviceMqttGateway by lazy { DeviceMqttGateway(secureStore) }

    val inventoryCollector: InventoryCollector by lazy { InventoryCollector(appContext) }

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        // Optional device-info fields must be OMITTED, not sent as explicit
        // `null`, when absent: the server validates the enroll payload with
        // zod's `.optional()`, which accepts `undefined` but rejects `null`.
        explicitNulls = false
    }

    private val deviceApi: DeviceApi by lazy { buildDeviceApi() }

    val deviceRepository: DeviceRepository by lazy {
        DeviceRepository(deviceApi, secureStore, inventoryCollector, deviceKeyStore)
    }

    private fun buildDeviceApi(): DeviceApi {
        if (BuildConfig.USE_MOCK) return MockDeviceApi()

        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(secureStore))
            .addInterceptor(logging)
            .build()

        // A device-provided base URL (from the QR provisioning extras) takes
        // precedence over the compile-time default.
        val baseUrl = secureStore.serverBaseUrl?.takeIf { it.isNotBlank() }
            ?: BuildConfig.MDM_SERVER_URL

        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(DeviceApi::class.java)
    }
}
