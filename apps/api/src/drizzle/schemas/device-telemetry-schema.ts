import { pgTable, uuid, jsonb } from "drizzle-orm/pg-core";
import { updatedAndCreatedAt } from "../timestampable";
import { devices } from "./device-schema";

export type DeviceNetworkTelemetry = {
    type: string;
    name: string | null;
    ipAddress: string | null;
    macAddress: string | null;
};

export type DeviceMemoryTelemetry = {
    totalBytes: number;
    usedBytes: number;
};

export type DeviceStorageTelemetry = {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
};

export type DeviceBatteryTelemetry = {
    level: number;
    charging: boolean;
    health: string;
};

export type DeviceLocationTelemetry = {
    latitude: number;
    longitude: number;
    accuracy: number;
};

// Column defaults, reused by DeviceRepository.patchTelemetry when merging a
// partial group into a row that doesn't exist yet (see PATCH /telemetry).
export const DEFAULT_MEMORY_TELEMETRY: DeviceMemoryTelemetry = { totalBytes: 0, usedBytes: 0 };
export const DEFAULT_STORAGE_TELEMETRY: DeviceStorageTelemetry = { totalBytes: 0, freeBytes: 0, usedBytes: 0 };
export const DEFAULT_BATTERY_TELEMETRY: DeviceBatteryTelemetry = { level: 0, charging: false, health: "unknown" };
export const DEFAULT_LOCATION_TELEMETRY: DeviceLocationTelemetry = { latitude: 0, longitude: 0, accuracy: 0 };

/**
 * Live device facts (network, memory, storage, battery, location) refreshed
 * on every inventory push (see features/device DeviceService.recordInventory)
 * — one row per device, overwritten each time, no history. Each group is
 * stored condensed as a single JSON column rather than flattened, mirroring
 * the shape already validated by `inventorySchema`.
 *
 * `network` is nullable (the collector can fail to read it entirely); the
 * others default to a zeroed/false object instead, since they're always
 * reportable and a missing value is indistinguishable from "not yet
 * reported" either way.
 */
export const deviceTelemetry = pgTable("device_telemetry", {
    deviceId: uuid("device_id").primaryKey().references(() => devices.id, { onDelete: "cascade" }),

    network: jsonb("network").$type<DeviceNetworkTelemetry>(),
    memory: jsonb("memory").$type<DeviceMemoryTelemetry>()
        .default(DEFAULT_MEMORY_TELEMETRY).notNull(),
    storage: jsonb("storage").$type<DeviceStorageTelemetry>()
        .default(DEFAULT_STORAGE_TELEMETRY).notNull(),
    battery: jsonb("battery").$type<DeviceBatteryTelemetry>()
        .default(DEFAULT_BATTERY_TELEMETRY).notNull(),
    location: jsonb("location").$type<DeviceLocationTelemetry>()
        .default(DEFAULT_LOCATION_TELEMETRY).notNull(),

    ...updatedAndCreatedAt,
});

export type DeviceTelemetrySqlInferSelect = typeof deviceTelemetry.$inferSelect;
export type DeviceTelemetrySqlInferInsert = typeof deviceTelemetry.$inferInsert;
