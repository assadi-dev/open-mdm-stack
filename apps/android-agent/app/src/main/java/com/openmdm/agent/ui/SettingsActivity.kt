package com.openmdm.agent.ui

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.openmdm.agent.ui.theme.OpenMdmAgentTheme

class SettingsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            OpenMdmAgentTheme {
                SettingsScreen()
            }
        }
    }
}

private enum class PermKind { RUNTIME, UNKNOWN_SOURCES }

private data class PermissionUiItem(
    val title: String,
    val subtitle: String,
    val granted: Boolean,
    val kind: PermKind,
    val permissions: List<String> = emptyList(),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    val activity = context as? Activity

    // Permission/grant state is re-read whenever this counter changes: on resume
    // (e.g. coming back from a Settings screen) and after each launcher result.
    var refreshKey by remember { mutableIntStateOf(0) }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) refreshKey++
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val settingsLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { refreshKey++ }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { result ->
        // If everything was denied and the system won't show the dialog again
        // (permanently denied), route the user to the app's settings page.
        val allDenied = result.isNotEmpty() && result.values.all { granted -> !granted }
        val permanentlyDenied = result.keys.any { perm ->
            activity != null && !ActivityCompat.shouldShowRequestPermissionRationale(activity, perm)
        }
        if (allDenied && permanentlyDenied) {
            settingsLauncher.launch(appDetailsIntent(context))
        }
        refreshKey++
    }

    val items = remember(refreshKey) { buildPermissionItems(context) }

    fun onToggle(item: PermissionUiItem, turnOn: Boolean) {
        when (item.kind) {
            PermKind.RUNTIME -> when {
                turnOn && !item.granted -> permissionLauncher.launch(item.permissions.toTypedArray())
                // Runtime grants cannot be revoked in-app: send the user to Settings.
                !turnOn && item.granted -> settingsLauncher.launch(appDetailsIntent(context))
                else -> Unit
            }

            PermKind.UNKNOWN_SOURCES ->
                settingsLauncher.launch(unknownSourcesIntent(context))
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = { TopAppBar(title = { Text("Paramètres") }) },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text("Permissions", style = MaterialTheme.typography.titleMedium)
            items.forEach { item ->
                PermissionRow(item) { onToggle(item, it) }
                HorizontalDivider()
            }
        }
    }
}

@Composable
private fun PermissionRow(item: PermissionUiItem, onToggle: (Boolean) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(item.title, style = MaterialTheme.typography.titleSmall)
            Text(
                item.subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                if (item.granted) "Accordée" else "Non accordée",
                style = MaterialTheme.typography.labelSmall,
                color = if (item.granted) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.error
                },
            )
        }
        Spacer(Modifier.width(12.dp))
        Switch(checked = item.granted, onCheckedChange = onToggle)
    }
}

private val LOCATION_PERMISSIONS = listOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION,
)
private val PHONE_PERMISSIONS = listOf(Manifest.permission.READ_PHONE_STATE)

private fun storagePermissions(): List<String> =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        listOf(
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.READ_MEDIA_VIDEO,
            Manifest.permission.READ_MEDIA_AUDIO,
        )
    } else {
        listOf(Manifest.permission.READ_EXTERNAL_STORAGE)
    }

private fun isGranted(context: Context, permissions: List<String>): Boolean =
    permissions.isNotEmpty() && permissions.all {
        ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
    }

private fun canInstallUnknownApps(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
        context.packageManager.canRequestPackageInstalls()

private fun buildPermissionItems(context: Context): List<PermissionUiItem> {
    val storage = storagePermissions()
    return listOf(
        PermissionUiItem(
            title = "Localisation",
            subtitle = "Position de l'appareil (Wi-Fi/GPS)",
            granted = isGranted(context, LOCATION_PERMISSIONS),
            kind = PermKind.RUNTIME,
            permissions = LOCATION_PERMISSIONS,
        ),
        PermissionUiItem(
            title = "Téléphone",
            subtitle = "Numéro de série de l'appareil",
            granted = isGranted(context, PHONE_PERMISSIONS),
            kind = PermKind.RUNTIME,
            permissions = PHONE_PERMISSIONS,
        ),
        PermissionUiItem(
            title = "Stockage",
            subtitle = "Lecture des fichiers / médias",
            granted = isGranted(context, storage),
            kind = PermKind.RUNTIME,
            permissions = storage,
        ),
        PermissionUiItem(
            title = "Sources inconnues",
            subtitle = "Installer des APK hors store",
            granted = canInstallUnknownApps(context),
            kind = PermKind.UNKNOWN_SOURCES,
        ),
    )
}

private fun appDetailsIntent(context: Context): Intent =
    Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.fromParts("package", context.packageName, null),
    )

private fun unknownSourcesIntent(context: Context): Intent =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:${context.packageName}"),
        )
    } else {
        appDetailsIntent(context)
    }
