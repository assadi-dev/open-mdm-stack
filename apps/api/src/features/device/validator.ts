import z from "zod";
import { HTTPNotFoundException } from "@core/exception";
import {

    deviceDecoder,
    DeleteDevicesInput,
    DeviceCollectionQuery,
    EnrollDeviceInput,
    HeartbeatInput,
    InventoryInput,
    RefreshDevicesInput,
    TelemetryPatchInput,
    UpdateDeviceInput,
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

export const validateDeviceCollectionQuery = (query: unknown): DeviceCollectionQuery => {
    const result = deviceDecoder.collection(query);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateUpdateDeviceInput = (body: unknown): UpdateDeviceInput => {
    const result = deviceDecoder.update(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateDeleteDevicesInput = (body: unknown): DeleteDevicesInput => {
    const result = deviceDecoder.deleteMany(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateRefreshDevicesInput = (body: unknown): RefreshDevicesInput => {
    const result = deviceDecoder.refreshMany(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

/** Device ids are UUIDs; anything else can't exist (and would make Postgres throw). */
export const validateDeviceIdParam = (id: string): string => {
    if (!z.uuid().safeParse(id).success) {
        throw new HTTPNotFoundException("Device not found");
    }
    return id;
};
