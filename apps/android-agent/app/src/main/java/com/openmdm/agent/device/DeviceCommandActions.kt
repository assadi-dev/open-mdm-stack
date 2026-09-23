package com.openmdm.agent.device

/**
 * The device-owner actions a remote command can trigger (see
 * [com.openmdm.agent.mqtt.CommandExecutor]). Extracted as an interface,
 * implemented by [DeviceOwnerManager], so a unit test can substitute a
 * recording fake instead of a real [android.app.admin.DevicePolicyManager] —
 * same pattern as [com.openmdm.agent.data.remote.DeviceApi] / MockDeviceApi.
 */
interface DeviceCommandActions {
    fun lockNow()
    fun reboot()
    fun setLockScreenMessage(message: String?)
    fun requestUnlock()
}
