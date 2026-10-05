/**
 * Why a device is refused, sent as `reason` next to a 403 (and as `code` by `requireDeviceAuth`) so a client can tell
 * the cases apart without reading the message.
 */
export const DEVICE_REFUSAL = {
    notEnrolled: "DEVICE_NOT_ENROLLED",
    blocked: "DEVICE_BLOCKED",
} as const;

export type DeviceRefusalReason = (typeof DEVICE_REFUSAL)[keyof typeof DEVICE_REFUSAL];
