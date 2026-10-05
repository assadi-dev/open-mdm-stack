package com.openmdm.agent.data.remote

import com.openmdm.agent.data.remote.dto.ChallengeResponse
import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.EnrollResponse
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
import com.openmdm.agent.data.remote.dto.InventoryRequest
import com.openmdm.agent.data.remote.dto.OtpVerifyRequest
import com.openmdm.agent.data.remote.dto.SimpleOkResponse
import com.openmdm.agent.data.remote.dto.TelemetryRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * Retrofit surface for the MDM backend. [challenge], [verifyOtp] and [enroll] are the only
 * unauthenticated endpoints (the single-use challenge from the first two IS the
 * enrollment authorization, see [EnrollRequest]); the others are
 * authenticated with the device JWT obtained at enrollment (injected by
 * [AuthInterceptor]).
 */
interface DeviceApi {

    @GET("api/v1/enrollment/challenge")
    suspend fun challenge(): ChallengeResponse

    /**
     * Exchanges the code an administrator generated for a challenge, same shape as [challenge]'s. A code that is
     * unknown, expired or already used is answered with 400 (an `HttpException`).
     */
    @POST("api/v1/enrollment/otp-verify")
    suspend fun verifyOtp(@Body body: OtpVerifyRequest): ChallengeResponse

    @POST("api/v1/devices/enroll")
    suspend fun enroll(@Body body: EnrollRequest): EnrollResponse

    @POST("api/v1/devices/{deviceId}/heartbeat")
    suspend fun heartbeat(
        @Path("deviceId") deviceId: String,
        @Body body: HeartbeatRequest,
    ): SimpleOkResponse

    // Not yet called by the agent — full software/hardware inventory (apps
    // list included) is a later chantier. See [telemetry] for the current
    // hardware-facts report.
    @POST("api/v1/devices/{deviceId}/inventory")
    suspend fun inventory(
        @Path("deviceId") deviceId: String,
        @Body body: InventoryRequest,
    ): SimpleOkResponse

    @PATCH("api/v1/devices/{deviceId}/telemetry")
    suspend fun telemetry(
        @Path("deviceId") deviceId: String,
        @Body body: TelemetryRequest,
    ): SimpleOkResponse
}
