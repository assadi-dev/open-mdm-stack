package com.openmdm.agent.data.remote

import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.EnrollResponse
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
import com.openmdm.agent.data.remote.dto.InventoryRequest
import com.openmdm.agent.data.remote.dto.SimpleOkResponse
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * Retrofit surface for the MDM backend. The [EnrollRequest] call is the only
 * unauthenticated endpoint; the others are authenticated with the device JWT
 * obtained at enrollment (injected by [AuthInterceptor]).
 */
interface DeviceApi {

    @POST("api/v1/devices/enroll")
    suspend fun enroll(@Body body: EnrollRequest): EnrollResponse

    @POST("api/v1/devices/{deviceId}/heartbeat")
    suspend fun heartbeat(
        @Path("deviceId") deviceId: String,
        @Body body: HeartbeatRequest,
    ): SimpleOkResponse

    @POST("api/v1/devices/{deviceId}/inventory")
    suspend fun inventory(
        @Path("deviceId") deviceId: String,
        @Body body: InventoryRequest,
    ): SimpleOkResponse
}
