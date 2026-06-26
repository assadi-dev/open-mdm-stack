package com.openmdm.agent.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import com.openmdm.agent.MdmAgentApp
import com.openmdm.agent.di.AppContainer
import com.openmdm.agent.work.MdmWork
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AgentUiState(
    val isDeviceOwner: Boolean = false,
    val isAdminActive: Boolean = false,
    val isEnrolled: Boolean = false,
    val deviceId: String? = null,
    val lastHeartbeatAt: Long = 0L,
    val deviceModel: String = "",
    val osVersion: String = "",
    val serial: String = "",
    val busy: Boolean = false,
    val message: String? = null,
)

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
    }

    fun refresh() {
        val info = container.inventoryCollector.deviceInfo()
        _state.update {
            it.copy(
                isDeviceOwner = owner.isDeviceOwner,
                isAdminActive = owner.isAdminActive,
                isEnrolled = repository.isEnrolled,
                deviceId = repository.deviceId,
                lastHeartbeatAt = repository.lastHeartbeatAt,
                deviceModel = "${info.manufacturer} ${info.model}",
                osVersion = info.osVersion,
                serial = info.serial,
            )
        }
    }

    /** Dev fallback enrollment (when provisioned via ADB rather than QR). */
    fun enrollManually(token: String, baseUrl: String) {
        if (token.isBlank()) {
            _state.update { it.copy(message = "Enrollment token is required") }
            return
        }
        _state.update { it.copy(busy = true, message = null) }
        viewModelScope.launch {
            val result = repository.enroll(token.trim(), baseUrl.trim().ifBlank { null })
            result.onSuccess {
                MdmWork.schedulePeriodicHeartbeat(getApplication())
            }
            _state.update {
                it.copy(
                    busy = false,
                    message = if (result.isSuccess) "Enrolled" else "Enrollment failed",
                )
            }
            refresh()
        }
    }

    fun forceHeartbeat() {
        _state.update { it.copy(busy = true, message = null) }
        viewModelScope.launch {
            val result = repository.sendHeartbeat()
            _state.update {
                it.copy(
                    busy = false,
                    message = if (result.isSuccess) "Heartbeat sent" else "Heartbeat failed",
                )
            }
            refresh()
        }
    }

    fun sendInventory() {
        _state.update { it.copy(busy = true, message = null) }
        viewModelScope.launch {
            val result = repository.sendInventory()
            _state.update {
                it.copy(
                    busy = false,
                    message = if (result.isSuccess) "Inventory sent" else "Inventory failed",
                )
            }
        }
    }

    companion object {
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
