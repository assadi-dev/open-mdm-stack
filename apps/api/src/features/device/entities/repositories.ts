export type DeleteDeviceResult = {
    success: string[]
    failures: { id: string, reason: string }[]
}