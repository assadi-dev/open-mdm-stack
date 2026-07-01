package com.openmdm.agent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.ui.Modifier
import com.openmdm.agent.ui.AgentScreen
import com.openmdm.agent.ui.StartupPermissions
import com.openmdm.agent.ui.theme.OpenMdmAgentTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
}
