import { pgTable, text, timestamp, boolean, uuid, index, pgEnum } from "drizzle-orm/pg-core";
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

]);
