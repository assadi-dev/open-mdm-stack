import {

    deviceDecoder,
    EnrollDeviceInput,
    HeartbeatInput,
    InventoryInput,
    TelemetryPatchInput,
} from "./dto/schema";



export const validateEnrollDeviceInput = (body: unknown): EnrollDeviceInput => {
    const result = deviceDecoder.enroll(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateHeartbeatInput = (body: unknown): HeartbeatInput => {
    const result = deviceDecoder.heartbeat(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateInventoryInput = (body: unknown): InventoryInput => {
    const result = deviceDecoder.inventory(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateTelemetryPatchInput = (body: unknown): TelemetryPatchInput => {
    const result = deviceDecoder.telemetryPatch(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};
