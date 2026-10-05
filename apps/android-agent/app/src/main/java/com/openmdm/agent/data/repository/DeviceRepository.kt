package com.openmdm.agent.data.repository

import android.util.Log
import com.openmdm.agent.data.DeviceName
import com.openmdm.agent.data.local.DeviceKeyStore
import com.openmdm.agent.data.local.SecureDeviceStore
import com.openmdm.agent.data.remote.DeviceApi
import com.openmdm.agent.data.remote.dto.ChallengeResponse
import com.openmdm.agent.data.remote.dto.EnrollRequest
import com.openmdm.agent.data.remote.dto.HeartbeatRequest
import com.openmdm.agent.data.remote.dto.OtpVerifyRequest
import com.openmdm.agent.data.remote.dto.TelemetryRequest
import com.openmdm.agent.inventory.InventoryCollector
import com.openmdm.agent.security.CanonicalMessage
import java.time.Instant
import kotlinx.coroutines.CancellationException

/**
 * Orchestrates the device lifecycle against the backend + secure local store:
 * enroll → persist identity → report telemetry, then periodic heartbeats.
 */
class DeviceRepository(
    private val api: DeviceApi,
    private val store: SecureDeviceStore,
    private val inventory: InventoryCollector,
    private val deviceKeyStore: DeviceKeyStore,
) {

    val isEnrolled: Boolean get() = store.isEnrolled

    val deviceId: String? get() = store.deviceId

    /** The name received from the provisioning QR and saved at enrollment, `null` when there was none. */
    val deviceName: String? get() = store.deviceName

    /** The group and policy received from a USB enrollment, `null` until one carried them. */
    val groupId: String? get() = store.groupId

    val policyId: String? get() = store.policyId

    /** Left by a USB enrollment started without `autoEnroll`, for the enrollment with a code (see [SecureDeviceStore]). */
    val usbEnrollmentPending: Boolean get() = store.usbEnrollmentPending

    val usbSerial: String? get() = store.usbSerial

    val lastHeartbeatAt: Long get() = store.lastHeartbeatAt

    /**
     * Enrolls the device using the server's pinned-key handshake: fetches a
     * fresh single-use challenge (never cached — it has a short TTL and is
     * consumed on first use), signs the canonical device-identity message
     * with the device's Keystore key (proof of possession), then submits the
     * enrollment. There is no admin-issued enrollment token to pass in: the
     * challenge itself is the sole authorization.
     *
     * Only meant for the QR provisioning path, where nobody is there to type a code — the challenge is handed out
     * to whoever asks. A person enrolling by hand goes through [enroll], which asks for the code an administrator
     * generated first.
     *
     * [enrollmentMethod] is opaque to this method beyond being echoed into
     * the signed message and the request body — the server expects one of
     * "qr" | "manual" | "usb".
     *
     * [name] is the device name received from the provisioning QR, if any; it is cleaned up by
     * [DeviceName.normalize] and sent along, outside the signed message (it is an administrator's label, not an
     * identity fact).
     *
     * [serial] is the serial a USB enrollment received from ADB: it replaces the device's own only when the device
     * can't read it (see [InventoryCollector.deviceInfo]), and is then part of the signed message like any serial.
     */
    suspend fun autoEnroll(
        baseUrl: String?,
        enrollmentMethod: String = "manual",
        name: String? = null,
        serial: String? = null,
    ): Result<Unit> = performEnrollment(baseUrl, enrollmentMethod, name, serial) { api.challenge() }

    /**
     * Same handshake as [autoEnroll], the one difference being where the challenge comes from: instead of being
     * handed out freely, it is obtained by exchanging [code] — the short code an administrator generated in the
     * dashboard and read out to the person enrolling the device — at `POST enrollment/otp-verify`. The code is
     * single-use: it is consumed by that exchange, even if the enrollment then fails.
     *
     * A failure of the code step is reported as an [OtpVerifyException] in the returned [Result], so the caller can
     * tell a wrong/expired/used code ([OtpVerifyException.InvalidCode]) from a server or network problem. A [code]
     * that is not [OTP_LENGTH] digits (once trimmed) fails the same way without any request being sent. Failures of
     * the later steps (signature, `devices/enroll`) are not wrapped, as with [autoEnroll].
     */
    suspend fun enroll(
        baseUrl: String?,
        code: String,
        enrollmentMethod: String = "manual",
        name: String? = null,
        serial: String? = null,
    ): Result<Unit> {
        val otp = code.trim()
        if (!OTP_FORMAT.matches(otp)) {
            return Result.failure(OtpVerifyException.InvalidCode("The code must be $OTP_LENGTH digits"))
        }
        return performEnrollment(baseUrl, enrollmentMethod, name, serial) { verifyOtp(otp) }
    }

    private suspend fun verifyOtp(code: String): ChallengeResponse = try {
        api.verifyOtp(OtpVerifyRequest(code))
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        throw e.toOtpVerifyException()
    }

    /** The handshake shared by [autoEnroll] and [enroll]; [fetchChallenge] is the only step that differs. */
    private suspend fun performEnrollment(
        baseUrl: String?,
        enrollmentMethod: String,
        name: String?,
        serial: String?,
        fetchChallenge: suspend () -> ChallengeResponse,
    ): Result<Unit> = runCatching {
        baseUrl?.let { store.serverBaseUrl = it }

        // Generated once and reused for the app's lifetime: the server pins
        // this key to the device's androidId on first enrollment and rejects
        // a different key on re-enrollment.
        deviceKeyStore.ensureKeyPair()
        val publicKey = deviceKeyStore.publicKeyBase64()

        val enrolledName = DeviceName.normalize(name)

        val challenge = fetchChallenge()
        val timestamp = Instant.now().toString()
        val device = inventory.deviceInfo(
            publicKey = publicKey,
            enrollmentMethod = enrollmentMethod,
            serialFallback = serial,
        )
        val canonicalMessage = CanonicalMessage.build(
            model = device.model,
            manufacturer = device.manufacturer,
            release = device.release,
            serialNumber = device.serial,
            imei = device.imei,
            macAddress = device.macAddress,
            androidId = device.androidId,
            method = device.enrollmentMethod,
            timestamp = timestamp,
            publicKey = publicKey,
            challenge = challenge.challenge,
        )
        val signature = deviceKeyStore.sign(canonicalMessage)

        val response = api.enroll(
            EnrollRequest(
                challenge = challenge.challenge,
                timestamp = timestamp,
                signature = signature,
                device = device,
                name = enrolledName,
            )
        )
        store.saveEnrollment(response.deviceId, response.deviceToken)
        // Saved only once the server accepted the enrollment: a failed attempt (retried later with the same name)
        // leaves no name behind on a device that is not enrolled. `null` clears the one of a previous enrollment.
        store.deviceName = enrolledName
        // What a USB enrollment left for this one has been used: a later enrollment starts afresh.
        store.usbSerial = null
        store.usbEnrollmentPending = false
        Log.i(TAG, "Enrolled as deviceId=${response.deviceId}")
        // Best-effort first telemetry report; failure here must not fail enrollment.
        sendTelemetry().onFailure { Log.w(TAG, "Initial telemetry report failed", it) }
        Unit
    }.onFailure {
        if (it is CancellationException) throw it
        Log.e(TAG, "Enrollment failed", it)
    }

    suspend fun sendHeartbeat(): Result<Unit> = runCatching {
        val id = store.deviceId ?: error("Device not enrolled")
        val device = inventory.deviceInfo()
        api.heartbeat(
            id,
            HeartbeatRequest(
                battery = inventory.batteryInventory.batteryLevel(),
                storageFreeBytes = inventory.storageInventory.getFreeStorageBytes(),
                online = true,
                ts = System.currentTimeMillis(),
                screenOn = inventory.isScreenOn(),
                sdkVersion = device.sdkVersion,
                release = device.release,
                ipAddress = inventory.networkInventory.getIpAddress(),
                agentVersionName = device.agentVersionName,
                agentVersionCode = device.agentVersionCode,
                agentPackage = device.agentPackage,
            ),
        )
        store.lastHeartbeatAt = System.currentTimeMillis()
        Unit
    }.onFailure {
        if (it is CancellationException) throw it
        Log.w(TAG, "Heartbeat failed", it)
    }

    /**
     * Reports the device's current hardware facts (network, memory, storage,
     * battery, location) to `PATCH devices/{id}/telemetry`. Separate from
     * [sendHeartbeat] and failing independently of it — see [HeartbeatWorker]
     * and [com.openmdm.agent.ui.AgentViewModel.forceHeartbeat], which call
     * both and handle each result on its own.
     *
     * Stands in for a full inventory report for now — [DeviceApi.inventory]
     * (apps list included) is a later chantier.
     */
    suspend fun sendTelemetry(): Result<Unit> = runCatching {
        val id = store.deviceId ?: error("Device not enrolled")
        api.telemetry(
            id,
            TelemetryRequest(
                network = inventory.networkInventory.readNetworkInfo(),
                memory = inventory.storageInventory.readMemory(),
                storage = inventory.storageInventory.readStorage(),
                battery = inventory.batteryInventory.readBatteryStatus(),
                location = inventory.networkInventory.readLocation(),
            ),
        )
        Unit
    }.onFailure {
        if (it is CancellationException) throw it
        Log.w(TAG, "Telemetry report failed", it)
    }

    /**
     * Pushes the heartbeat and the telemetry snapshot — what the periodic [com.openmdm.agent.work.HeartbeatWorker] does,
     * and what a `refresh` command asks for on demand. The two calls are independent: both always run, so a failure on
     * one doesn't skip the other. Fails if either did (with the heartbeat's error first).
     */
    suspend fun report(): Result<Unit> {
        val heartbeat = sendHeartbeat()
        val telemetry = sendTelemetry()
        return heartbeat.exceptionOrNull()?.let { Result.failure(it) } ?: telemetry
    }

    companion object {
        /** Digits in an enrollment code — what `OTP_DIGITS` is in apps/api/src/features/enrollment/dto/schema.ts. */
        const val OTP_LENGTH = 6

        private val OTP_FORMAT = Regex("^\\d{$OTP_LENGTH}$")
        private const val TAG = "DeviceRepository"
    }
}
