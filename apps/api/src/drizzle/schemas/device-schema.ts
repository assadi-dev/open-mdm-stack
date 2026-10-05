import { pgTable, text, timestamp, boolean, uuid, index, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@repo/db/schemas/auth-schema";
import { updatedAndCreatedAt } from "../timestampable";
import { integer } from "drizzle-orm/pg-core";

export const enrollmentStatus = ["pending", "enrolled", "revoked", "unenrolled"] as const;
export const enrollmentMethod = ["qr", "manual", "usb"] as const;
export const enrollmentStatusEnum = pgEnum("enrollment_status", enrollmentStatus);
export const enrollmentMethodEnum = pgEnum("enrollment_method", enrollmentMethod);

/**
 * Single-use anti-replay nonce for the pinned-key enrollment handshake.
 */
export const enrollmentChallenges = pgTable(
    "enrollment_challenges",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        challenge: text("challenge").notNull().unique(),
        expiresAt: timestamp("expires_at").notNull(),
        consumedAt: timestamp("consumed_at"),
        ...updatedAndCreatedAt,
    },
    (table) => [
        index("enrollment_challenge_idx").on(table.challenge),
    ],
);

export type EnrollmentChallengeSqlInferSelect = typeof enrollmentChallenges.$inferSelect;
export type EnrollmentChallengeSqlInferInsert = typeof enrollmentChallenges.$inferInsert;

/**
 * Short numeric code an admin reads out to the person enrolling a device (typed in the agent, exchanged for a
 * challenge at `POST /enrollment/otp-verify`). Random, single-use and short-lived.
 *
 * The code space is small (6 digits), so uniqueness is only enforced among codes still waiting to be used —
 * a consumed code is kept as history and may be drawn again later. A row that expired without being used is
 * recycled in place by `OtpRepository.issue`, so no purge job is needed.
 */
export const enrollmentOtps = pgTable(
    "enrollment_otps",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        code: text("code").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        consumedAt: timestamp("consumed_at"),
        ...updatedAndCreatedAt,
    },
    (table) => [
        uniqueIndex("enrollment_otps_pending_code_uq").on(table.code).where(sql`${table.consumedAt} is null`),
    ],
);

export type EnrollmentOtpSqlInferSelect = typeof enrollmentOtps.$inferSelect;
export type EnrollmentOtpSqlInferInsert = typeof enrollmentOtps.$inferInsert;

/**
 * A device enrolled via the pinned-key handshake. Holds the identity
 * reported at enrollment and is the `sub` of the long-lived device JWT
 * (deviceToken).
 */
export const devices = pgTable("devices", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Audit stamp of the identity verified at the most recent (re-)enrollment
    // ("<androidId>:<publicKey>"), refreshed by DeviceService.create. Not a
    // FK — continuity is enforced in application code by comparing
    // `publicKey` against what's already pinned for a given `androidId`
    // (see DeviceRepository.findByAndroidId/reEnrollDevice).
    enrollmentIdentity: text("enrollment_identity").notNull(),
    // Label given by an admin (e.g. "Tablette entrepôt 3"); NULL until one is set.
    // The devices list falls back to the model (see device_overview.display_name).
    name: text("name"),
    serial: text("serial"),
    androidId: text("android_id").unique(),
    brand: text("brand"),
    model: text("model"),
    manufacturer: text("manufacturer"),
    release: text("release"),
    sdkVersion: integer("sdk_version"),
    imei: text("imei"),
    macAddress: text("mac_address"),
    ipAddress: text("ip_address"),
    enrollmentStatus: enrollmentStatusEnum("enrollment_status").default("pending").notNull(),
    enrollmentMethod: enrollmentMethodEnum("enrollment_method").default("manual").notNull(),
    publicKey: text("public_key"),
    lastHeartbeatAt: timestamp("last_heartbeat_at"),
    // MQTT presence, driven by mdm/devices/{id}/status (retained + Last Will).
    online: boolean("online").default(false).notNull(),
    presenceChangedAt: timestamp("presence_changed_at"),
    // Last known screen power state (on/off), reported by the device
    // whenever it changes (see CommandService.handleScreen).
    isScreenOn: boolean("is_screen_on").default(false).notNull(),
    // Set by an admin (see DeviceService.block): a blocked device is turned away by
    // requireDeviceAuth (403 DEVICE_BLOCKED). NULL while the device isn't blocked.
    blockedAt: timestamp("blocked_at"),
    // Account the device is assigned to, shown as "Utilisateur" in the devices
    // list (see device_overview). Cleared if the account is deleted.
    assignedToUserId: text("assigned_to_user_id").references(() => user.id, { onDelete: "set null" }),
    //policyId: uuid("policy_id"),
    //groupId: uuid("group_id"),
    agentVersionCode: integer("agent_version_code"),
    agentVersionName: text("agent_version_name"),
    agentPackage: text("agent_package"),

    ...updatedAndCreatedAt,
}, (table) => [
    index("device_android_id_idx").on(table.androidId),
    index("device_enrollment_method_idx").on(table.enrollmentMethod),
    index("device_enrollment_identity_idx").on(table.enrollmentIdentity),
    index("device_assigned_to_user_idx").on(table.assignedToUserId),

]);
