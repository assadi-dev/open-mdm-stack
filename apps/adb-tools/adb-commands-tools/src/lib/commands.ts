const DPM_PACKAGE_NAME = 'com.openmdm.agent/.device.MdmDeviceAdminReceiver'


export const ADB_COMMANDS = {
    devices: 'adb devices',
    killServer: 'adb kill-server',
    startServer: 'adb start-server',
    reboot: 'reboot',
    dpmSetDeviceOwner: `dpm set-device-owner ${DPM_PACKAGE_NAME}`,
    dpmRemoveDeviceOwner: `dpm remove-active-admin ${DPM_PACKAGE_NAME}`

} as const