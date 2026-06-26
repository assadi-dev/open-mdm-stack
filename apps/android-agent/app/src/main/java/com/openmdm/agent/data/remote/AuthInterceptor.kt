package com.openmdm.agent.data.remote

import com.openmdm.agent.data.local.SecureDeviceStore
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Adds `Authorization: Bearer <deviceToken>` to every request once the device
 * has been enrolled. The enroll call runs before a token exists and is sent
 * unauthenticated.
 */
class AuthInterceptor(
    private val store: SecureDeviceStore,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = store.deviceToken
        val request = if (token.isNullOrBlank()) {
            chain.request()
        } else {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }
        return chain.proceed(request)
    }
}
