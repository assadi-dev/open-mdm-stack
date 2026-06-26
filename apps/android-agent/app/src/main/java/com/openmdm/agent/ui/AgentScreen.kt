package com.openmdm.agent.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import java.text.DateFormat
import java.util.Date

@Composable
fun AgentScreen(
    modifier: Modifier = Modifier,
    viewModel: AgentViewModel = viewModel(factory = AgentViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Open MDM Agent", style = MaterialTheme.typography.headlineSmall)

        StatusCard(state)

        if (!state.isEnrolled) {
            ManualEnrollmentCard(
                busy = state.busy,
                onEnroll = viewModel::enrollManually,
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = viewModel::refresh, enabled = !state.busy) {
                Text("Refresh")
            }
            if (state.isEnrolled) {
                OutlinedButton(onClick = viewModel::forceHeartbeat, enabled = !state.busy) {
                    Text("Heartbeat")
                }
                OutlinedButton(onClick = viewModel::sendInventory, enabled = !state.busy) {
                    Text("Inventory")
                }
            }
        }

        state.message?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
    }
}

@Composable
private fun StatusCard(state: AgentUiState) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            InfoRow("Device Owner", if (state.isDeviceOwner) "yes" else "no")
            InfoRow("Admin active", if (state.isAdminActive) "yes" else "no")
            InfoRow("Enrolled", if (state.isEnrolled) "yes" else "no")
            InfoRow("Device id", state.deviceId ?: "—")
            InfoRow("Last heartbeat", formatTimestamp(state.lastHeartbeatAt))
            InfoRow("Model", state.deviceModel)
            InfoRow("OS", state.osVersion)
            InfoRow("Serial", state.serial)
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.padding(horizontal = 8.dp))
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun ManualEnrollmentCard(
    busy: Boolean,
    onEnroll: (token: String, baseUrl: String) -> Unit,
) {
    var token by remember { mutableStateOf("") }
    var baseUrl by remember { mutableStateOf("") }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Manual enrollment (dev)", style = MaterialTheme.typography.titleMedium)
            Text(
                "Used when provisioned via ADB instead of QR.",
                style = MaterialTheme.typography.bodySmall,
            )
            OutlinedTextField(
                value = token,
                onValueChange = { token = it },
                label = { Text("Enrollment token") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = baseUrl,
                onValueChange = { baseUrl = it },
                label = { Text("Server base URL (optional)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                onClick = { onEnroll(token, baseUrl) },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (busy) "Enrolling…" else "Enroll")
            }
        }
    }
}

private fun formatTimestamp(ts: Long): String =
    if (ts <= 0L) "never" else DateFormat.getDateTimeInstance().format(Date(ts))
