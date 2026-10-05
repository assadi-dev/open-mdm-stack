package com.openmdm.agent.ui

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import com.openmdm.agent.MdmAgentApp
import com.openmdm.agent.data.repository.OtpVerifyException
import com.openmdm.agent.di.AppContainer
import com.openmdm.agent.mqtt.MqttConnectionService
import com.openmdm.agent.mqtt.MqttConnectionState
import com.openmdm.agent.work.MdmWork
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.IOException
import retrofit2.HttpException

data class AgentUiState(
    val isDeviceOwner: Boolean = false,
    val isAdminActive: Boolean = false,
    val isEnrolled: Boolean = false,
    val deviceId: String? = null,
    // The name received from the provisioning QR; `null` when there is none, and the screen shows nothing then.
    val deviceName: String? = null,
    // The USB enrollment asked the agent to enroll by itself, and it hasn't yet: the code input stays greyed and a
    // switch offers to turn it off.
    val autoEnroll: Boolean = false,
    // The group and policy received from a USB enrollment; `null` (and not shown) until one carried them.
    val groupId: String? = null,
    val policyId: String? = null,
    val lastHeartbeatAt: Long = 0L,
    val deviceModel: String = "",
    val osVersion: String = "",
    val serial: String = "",
    val busy: Boolean = false,
    // An enrollment running in the background (USB `autoEnroll`, provisioning QR): the screen waits for it, it
    // didn't start it, so `busy` isn't set.
    val enrolling: Boolean = false,
    val message: String? = null,
    val mqttState: MqttConnectionState = MqttConnectionState.DISCONNECTED,
)

private const val ENROLLMENT_FAILED = "Enrollment failed"

/**
 * What the screen says once an enrollment attempt ended: [failure] is `null` when it succeeded. The code step reports
 * an [OtpVerifyException]; the enrollment by itself (no code) lets the network and HTTP errors through as they are.
 */
internal fun enrollmentMessage(failure: Throwable?): String = when (failure) {
    null -> "Enrolled"
    is OtpVerifyException.InvalidCode -> "Code invalide, expiré ou déjà utilisé"
    is OtpVerifyException.Rejected -> "Demande refusée par le serveur (HTTP ${failure.status})"
    is OtpVerifyException.Server -> "Erreur du serveur (HTTP ${failure.status}), réessaie plus tard"
    is OtpVerifyException.Network, is IOException -> "Serveur injoignable, vérifie la connexion"
    is HttpException ->
        if (failure.code() in 500..599) "Erreur du serveur (HTTP ${failure.code()}), réessaie plus tard"
        else "Demande refusée par le serveur (HTTP ${failure.code()})"
    else -> ENROLLMENT_FAILED
}

/** The toast of an automatic enrollment that failed in the background; the reason is given when it is known. */
internal fun autoEnrollmentFailureMessage(failure: Throwable): String {
    val reason = enrollmentMessage(failure).takeUnless { it == ENROLLMENT_FAILED }
    return if (reason == null) "Échec de l'enrôlement automatique" else "Échec de l'enrôlement automatique : $reason"
}

class AgentViewModel(
    app: Application,
    private val container: AppContainer,
) : AndroidViewModel(app) {

    private val repository = container.deviceRepository
    private val owner = container.deviceOwnerManager

    private val _state = MutableStateFlow(AgentUiState())
    val state: StateFlow<AgentUiState> = _state.asStateFlow()

    init {
        refresh()
        container.mqttGateway.connectionState
            .onEach { mqttState -> _state.update { it.copy(mqttState = mqttState) } }
            .launchIn(viewModelScope)
        // An enrollment started elsewhere (USB `autoEnroll`) ends without this screen: it follows what the enrollment
        // saves (the device id, the name…), and whether the work is still running.
        repository.changes
            .onEach { refresh() }
            .launchIn(viewModelScope)
        MdmWork.enrollmentInProgress(app)
            .onEach { running -> _state.update { it.copy(enrolling = running) } }
            .launchIn(viewModelScope)
    }

    fun refresh() {
        val info = container.inventoryCollector.deviceInfo()
        _state.update {
            it.copy(
                isDeviceOwner = owner.isDeviceOwner,
                isAdminActive = owner.isAdminActive,
                isEnrolled = repository.isEnrolled,
                deviceId = repository.deviceId,
                deviceName = repository.deviceName,
                autoEnroll = repository.autoEnroll,
                groupId = repository.groupId,
                policyId = repository.policyId,
                lastHeartbeatAt = repository.lastHeartbeatAt,
                deviceModel = "${info.manufacturer} ${info.model}",
                osVersion = info.osVersion,
                serial = info.serial.orEmpty(),
            )
        }
    }

    /**
     * Manual enrollment: [code] is the one an administrator generated in the dashboard and read out, exchanged for a
     * challenge by [DeviceRepository.enroll]. [baseUrl] is an optional server base URL override. Each way the code
     * step can fail gets its own message (see [enrollmentMessage]).
     *
     * When the agent was started by a USB enrollment without `autoEnroll` (see
     * [com.openmdm.agent.enrollment.UsbEnrollmentHandler]), the code completes it: the enrollment is reported as
     * `usb`, and the saved name and serial are sent along. Both are optional, each is sent only when one was saved.
     */
    fun enroll(baseUrl: String, code: String) = runEnrollment {
        repository.enroll(
            baseUrl = baseUrl.trim().ifBlank { null },
            code = code,
            enrollmentMethod = enrollmentMethod(),
            name = repository.deviceName,
            serial = repository.usbSerial,
        )
    }

    /**
     * The button while the automatic enrollment asked by the USB enrollment is on: no code, the same enrollment the
     * background one ran (see [com.openmdm.agent.work.EnrollWorker]), run again from the screen after it failed.
     * Its failure is shown on the screen (see [enrollmentMessage]).
     */
    fun autoEnroll(baseUrl: String) = runEnrollment {
        repository.autoEnroll(
            baseUrl = baseUrl.trim().ifBlank { null },
            enrollmentMethod = enrollmentMethod(),
            name = repository.deviceName,
            serial = repository.usbSerial,
        )
    }

    /**
     * The switch turned off: the variable is removed from the store, the background enrollment is cancelled (it would
     * otherwise enroll the device behind the person's back) and the code input is free. The button then enrolls with
     * the code ([enroll]).
     */
    fun disableAutoEnroll() {
        repository.disableAutoEnroll()
        MdmWork.cancelEnrollment(getApplication())
        // The failure of the automatic attempt no longer applies to what the person is about to do.
        _state.update { it.copy(message = null) }
        refresh()
    }

    // An enrollment started over USB is reported as such, whichever way it ends (code or automatic).
    private fun enrollmentMethod() =
        if (repository.usbEnrollmentPending) MdmWork.METHOD_USB else MdmWork.METHOD_MANUAL

    /**
     * Enrollment after scanning the server's QR (see [EnrollmentQrParser], which extracts a `serverBaseUrl` and the
     * optional device [name]): the QR itself is the authorization, so no code is asked for, as with the provisioning
     * QR ([DeviceRepository.autoEnroll]).
     */
    fun enrollFromQr(baseUrl: String, name: String?) = runEnrollment {
        repository.autoEnroll(baseUrl.trim().ifBlank { null }, MdmWork.METHOD_QR, name)
    }

    private fun runEnrollment(enrollment: suspend () -> Result<Unit>) {
        _state.update { it.copy(busy = true, message = null) }
        viewModelScope.launch {
            val result = enrollment()
            result.onSuccess {
                MdmWork.schedulePeriodicHeartbeat(getApplication())
                // A refused start (e.g. the app went to the background meanwhile) must not leave the screen stuck on
                // "busy": enrollment itself did succeed, and MdmAgentApp/BootReceiver start the service again later.
                runCatching { MqttConnectionService.start(getApplication()) }
                    .onFailure { Log.w(TAG, "Could not start MqttConnectionService after enrollment", it) }
            }
            _state.update {
                it.copy(busy = false, message = enrollmentMessage(result.exceptionOrNull()))
            }
            refresh()
        }
    }

    /**
     * Sends both the heartbeat and the telemetry snapshot — two independent
     * calls (see [DeviceRepository.sendHeartbeat]/[DeviceRepository.sendTelemetry]),
     * each with its own outcome reflected in [AgentUiState.message] rather
     * than one masking the other.
     */
    fun forceHeartbeat() {
        _state.update { it.copy(busy = true, message = null) }
        viewModelScope.launch {
            val heartbeat = repository.sendHeartbeat()
            val telemetry = repository.sendTelemetry()
            _state.update {
                it.copy(
                    busy = false,
                    message = "Heartbeat ${if (heartbeat.isSuccess) "sent" else "failed"}, " +
                        "telemetry ${if (telemetry.isSuccess) "sent" else "failed"}",
                )
            }
            refresh()
        }
    }

    fun sendTelemetry() {
        _state.update { it.copy(busy = true, message = null) }
        viewModelScope.launch {
            val result = repository.sendTelemetry()
            _state.update {
                it.copy(
                    busy = false,
                    message = if (result.isSuccess) "Telemetry sent" else "Telemetry failed",
                )
            }
        }
    }

    /**
     * Debug convenience: relinquishes Device Owner locally, for resetting a
     * test device without a full factory reset (`adb shell dpm
     * remove-active-admin` refuses on a non-test admin — only the owner app
     * itself can step down, see [com.openmdm.agent.device.DeviceOwnerManager.clearDeviceOwner]).
     */
    fun removeDeviceOwner() {
        val success = owner.clearDeviceOwner()
        _state.update {
            it.copy(message = if (success) "Device owner retiré" else "Échec du retrait")
        }
        refresh()
    }

    companion object {
        private const val TAG = "AgentViewModel"

        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : androidx.lifecycle.ViewModel> create(
                modelClass: Class<T>,
                extras: CreationExtras,
            ): T {
                val app = extras[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY]
                        as MdmAgentApp
                return AgentViewModel(app, app.container) as T
            }
        }
    }
}
