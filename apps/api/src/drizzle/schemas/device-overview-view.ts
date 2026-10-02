import { eq, sql } from "drizzle-orm";
import { pgView } from "drizzle-orm/pg-core";
import { user } from "@repo/db/schemas/auth-schema";
import { deviceCommands } from "./command-schema";
import { devices } from "./device-schema";
import { deviceTelemetry } from "./device-telemetry-schema";

/**
 * pending         enrollment not finished yet
 * offline         enrolled, MQTT presence is down
 * commandRunning  online with a command still in flight (see deviceCommands)
 * online          none of the above
 *
 * There is no compliant / nonCompliant: no policy is evaluated yet.
 */
export const deviceOverviewStatus = ["pending", "offline", "commandRunning", "online"] as const;
export type DeviceOverviewStatus = (typeof deviceOverviewStatus)[number];

/**
 * Read model behind the dashboard's devices list — a plain (not materialized)
 * view, so status and last contact are computed at read time. Its columns
 * are what `GET /devices` sorts, searches and filters on, so the derived
 * status and the battery level are written once, here.
 *
 * - Only pending and enrolled devices (revoked / unenrolled are not listed).
 * - `displayName` is the admin-given name, or the model when there is none
 *   (a blank name counts as none). It is the first line of the "Appareil" cell,
 *   and what that column sorts and searches on.
 * - `battery` is NULL when never reported: telemetry defaults to level 0,
 *   and a phone at 0 % is off anyway.
 * - `lastHeartbeatAt` and `presenceChangedAt` are both exposed as-is; both
 *   are NULL for a device never seen. The front decides which one to show.
 * - SQL literals stay in the template: a view definition can't take parameters.
 */
export const deviceOverview = pgView("device_overview").as((qb) =>
    qb
        .select({
            id: devices.id,
            serial: devices.serial,
            androidId: devices.androidId,
            model: devices.model,
            brand: devices.brand,
            displayName: sql<string | null>`coalesce(nullif(btrim(${devices.name}), ''), ${devices.model})`.as("display_name"),
            release: devices.release,
            sdkVersion: devices.sdkVersion,
            assignedToUserId: devices.assignedToUserId,
            assignedToName: sql<string | null>`${user.name}`.as("assigned_to_name"),
            status: sql<DeviceOverviewStatus>`case
                when ${devices.enrollmentStatus} = 'pending' then 'pending'
                when not ${devices.online} then 'offline'
                when exists (
                    select 1 from ${deviceCommands}
                    where ${deviceCommands.deviceId} = ${devices.id}
                        and ${deviceCommands.status} in ('pending', 'sent', 'acknowledged')
                        and ${deviceCommands.expiresAt} > now()
                ) then 'commandRunning'
                else 'online'
            end`.as("status"),
            battery: sql<number | null>`nullif((${deviceTelemetry.battery} ->> 'level')::int, 0)`.as("battery"),
            lastHeartbeatAt: devices.lastHeartbeatAt,
            presenceChangedAt: devices.presenceChangedAt,
            createdAt: devices.createdAt,
        })
        .from(devices)
        .leftJoin(deviceTelemetry, eq(deviceTelemetry.deviceId, devices.id))
        .leftJoin(user, eq(user.id, devices.assignedToUserId))
        .where(sql`${devices.enrollmentStatus} in ('pending', 'enrolled')`),
);
