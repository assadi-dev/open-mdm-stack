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

data class AgentUiState(
    val isDeviceOwner: Boolean = false,
    val isAdminActive: Boolean = false,
    val isEnrolled: Boolean = false,
    val deviceId: String? = null,
    // The name received from the provisioning QR; `null` when there is none, and the screen shows nothing then.
    val deviceName: String? = null,
    // The group and policy received from a USB enrollment; `null` (and not shown) until one carried them.
    val groupId: String? = null,
    val policyId: String? = null,
    val lastHeartbeatAt: Long = 0L,
    val deviceModel: String = "",
    val osVersion: String = "",
    val serial: String = "",
    val busy: Boolean = false,
    val message: String? = null,
    val mqttState: MqttConnectionState = MqttConnectionState.DISCONNECTED,
)

/** What the screen says once an enrollment attempt ended: [failure] is `null` when it succeeded. */
internal fun enrollmentMessage(failure: Throwable?): String = when (failure) {
    null -> "Enrolled"
    is OtpVerifyException.InvalidCode -> "Code invalide, expiré ou déjà utilisé"
    is OtpVerifyException.Rejected -> "Demande refusée par le serveur (HTTP ${failure.status})"
    is OtpVerifyException.Server -> "Erreur du serveur (HTTP ${failure.status}), réessaie plus tard"
    is OtpVerifyException.Network -> "Serveur injoignable, vérifie la connexion"
    else -> "Enrollment failed"
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
     */
    fun enroll(baseUrl: String, code: String) = runEnrollment {
        repository.enroll(baseUrl.trim().ifBlank { null }, code, MdmWork.METHOD_MANUAL)
    }

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
