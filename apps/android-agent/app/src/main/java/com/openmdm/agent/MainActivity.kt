package com.openmdm.agent

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.openmdm.agent.enrollment.UsbEnrollmentArgs
import com.openmdm.agent.ui.AgentScreen
import com.openmdm.agent.ui.StartupPermissions
import com.openmdm.agent.ui.theme.OpenMdmAgentTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Only on a real start: after a rotation the intent is the same one, already handled.
        if (savedInstanceState == null) handleUsbEnrollment(intent)
        enableEdgeToEdge()
        setContent {
            OpenMdmAgentTheme {
                StartupPermissions()
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    AgentScreen(modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }

    // The dashboard starts the agent with `-S` (stopped first, so onCreate runs), but an `am start` without it reaches
    // the running activity here.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleUsbEnrollment(intent)
    }

    /** The parameters of a USB enrollment started over ADB, if this intent carries any (see [UsbEnrollmentArgs]). */
    private fun handleUsbEnrollment(intent: Intent?) {
        val args = UsbEnrollmentArgs.from(intent) ?: return
        (application as MdmAgentApp).container.usbEnrollmentHandler.handle(args)
    }
}
