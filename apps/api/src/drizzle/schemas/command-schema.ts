import { pgTable, text, timestamp, uuid, index, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { updatedAndCreatedAt } from "../timestampable";
import { devices } from "./device-schema";

export const commandType = ["lock", "unlock", "reboot", "set_lock_message", "factory_reset", "clear_apps_data", "run_app", "uninstall_app", "install_app", "block_app", "unblock_app", "kiosk_mode", "get_location", "get_wifi_list", "remote_cast", "stop_remote_cast"] as const;
/**
 * pending      created, not yet handed to the broker (or broker unreachable)
 * sent         published on mdm/devices/{id}/commands (QoS 1)
 * acknowledged device confirmed reception
 * succeeded    device executed it
 * failed       device reported an execution error
 * expired      never acknowledged before expiresAt
 */
export const commandStatus = ["pending", "sent", "acknowledged", "succeeded", "failed", "expired"] as const;
export const commandTypeEnum = pgEnum("command_type", commandType);
export const commandStatusEnum = pgEnum("command_status", commandStatus);

/**
 * Remote command issued by an admin to a device. Postgres is the source of
 * truth; MQTT is only the transport (see features/command).
 */
export const deviceCommands = pgTable("device_commands", {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceId: uuid("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
    type: commandTypeEnum("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    status: commandStatusEnum("status").default("pending").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>(),
    error: text("error"),
    sentAt: timestamp("sent_at"),
    acknowledgedAt: timestamp("acknowledged_at"),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at").notNull(),
    ...updatedAndCreatedAt,
}, (table) => [
    index("device_command_device_status_idx").on(table.deviceId, table.status),
]);

export type DeviceCommandSqlInferSelect = typeof deviceCommands.$inferSelect;
export type DeviceCommandSqlInferInsert = typeof deviceCommands.$inferInsert;
