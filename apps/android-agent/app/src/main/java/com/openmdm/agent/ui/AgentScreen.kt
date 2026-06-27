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
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import android.content.Intent
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
    val context = LocalContext.current

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

        OutlinedButton(
            onClick = { context.startActivity(Intent(context, SettingsActivity::class.java)) },
        ) {
            Text("Paramètres")
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
    var code by remember { mutableStateOf("") }
    var baseUrl by remember { mutableStateOf("") }
    var showAdvanced by remember { mutableStateOf(false) }

    val scanLauncher = rememberLauncherForActivityResult(ScanContract()) { result ->
        val contents = result.contents ?: return@rememberLauncherForActivityResult
        EnrollmentQrParser.parse(contents)?.let { parsed ->
            onEnroll(parsed.tokenOrCode, parsed.baseUrl ?: baseUrl)
        }
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Enrôlement", style = MaterialTheme.typography.titleMedium)
            Text(
                "Saisis le code d'enrôlement, ou scanne le QR.",
                style = MaterialTheme.typography.bodySmall,
            )
            OutlinedTextField(
                value = code,
                onValueChange = { code = it.uppercase() },
                label = { Text("Code d'enrôlement") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            if (showAdvanced) {
                OutlinedTextField(
                    value = baseUrl,
                    onValueChange = { baseUrl = it },
                    label = { Text("Server base URL (optionnel)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { onEnroll(code, baseUrl) },
                    enabled = !busy && code.isNotBlank(),
                    modifier = Modifier.weight(1f),
                ) {
                    Text(if (busy) "Enrôlement…" else "Enrôler")
                }
                OutlinedButton(
                    onClick = {
                        scanLauncher.launch(
                            ScanOptions()
                                .setOrientationLocked(false)
                                .setBeepEnabled(false)
                                .setPrompt("Scanner le QR d'enrôlement"),
                        )
                    },
                    enabled = !busy,
                ) {
                    Text("Scanner")
                }
            }

            TextButton(onClick = { showAdvanced = !showAdvanced }) {
                Text(if (showAdvanced) "Masquer les options" else "Options avancées")
            }
        }
    }
}

private fun formatTimestamp(ts: Long): String =
    if (ts <= 0L) "never" else DateFormat.getDateTimeInstance().format(Date(ts))
