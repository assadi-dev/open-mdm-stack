import {

    deviceDecoder,
    EnrollDeviceInput,
    HeartbeatInput,
    InventoryInput,
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
