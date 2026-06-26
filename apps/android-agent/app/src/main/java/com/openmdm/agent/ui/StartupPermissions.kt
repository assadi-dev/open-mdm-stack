package com.openmdm.agent.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat

/**
 * Requests the permissions the agent needs, on first launch, in sequence:
 *  1. Runtime dialogs — phone state (serial) + storage (legacy on <= Android 12,
 *     granular media on 13+).
 *  2. "Install unknown apps" — a special access that has no runtime dialog, so
 *     the user is sent to the corresponding Settings screen.
 *
 * Network/Wi-Fi permissions are normal and granted at install, so there is
 * nothing to prompt for there.
 */
@Composable
fun StartupPermissions() {
    val context = LocalContext.current

    val unknownSourcesLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { /* user returns from Settings; nothing else to do */ }

    fun maybeRequestUnknownSources() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !context.packageManager.canRequestPackageInstalls()
        ) {
            runCatching {
                unknownSourcesLauncher.launch(
                    Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:${context.packageName}"),
                    ),
                )
            }
        }
    }

    val storageLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) {
        // Chain to the special access once the runtime dialog(s) are done.
        maybeRequestUnknownSources()
    }

    LaunchedEffect(Unit) {
        val pending = runtimeDangerousPermissions().filter {
            ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
        }
        if (pending.isNotEmpty()) {
            storageLauncher.launch(pending.toTypedArray())
        } else {
            maybeRequestUnknownSources()
        }
    }
}

private fun runtimeDangerousPermissions(): List<String> = buildList {
    // Phone state — lets the agent read the serial without Device Owner privilege.
    add(Manifest.permission.READ_PHONE_STATE)
    // Storage.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        add(Manifest.permission.READ_MEDIA_IMAGES)
        add(Manifest.permission.READ_MEDIA_VIDEO)
        add(Manifest.permission.READ_MEDIA_AUDIO)
    } else {
        add(Manifest.permission.READ_EXTERNAL_STORAGE)
    }
}
