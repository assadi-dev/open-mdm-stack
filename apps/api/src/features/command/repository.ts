import { db as defaultDb } from "@drizzle/instance";
import { commandStatus, commandType, deviceCommands } from "@drizzle/schemas/command-schema";
import { devices } from "@drizzle/schemas/device-schema";
import { and, desc, eq, gt, inArray, lte, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

type CommandStatus = typeof commandStatus[number];

export class CommandRepository {

    constructor(private readonly db: NodePgDatabase = defaultDb) { }

    async create(input: {
        deviceId: string;
        type: typeof commandType[number];
        payload: Record<string, unknown>;
        expiresAt: Date;
    }) {
        const [row] = await this.db.insert(deviceCommands).values(input).returning();
        return row;
    }

    async listByDevice(deviceId: string, limit = 50) {
        return this.db
            .select()
            .from(deviceCommands)
            .where(eq(deviceCommands.deviceId, deviceId))
            .orderBy(desc(deviceCommands.createdAt))
            .limit(limit);
    }

    /** Commands the device hasn't acknowledged yet and that are still valid. */
    async findDeliverable(deviceId: string) {
        return this.db
            .select()
            .from(deviceCommands)
            .where(and(
                eq(deviceCommands.deviceId, deviceId),
                inArray(deviceCommands.status, ["pending", "sent"]),
                gt(deviceCommands.expiresAt, new Date()),
            ))
            .orderBy(deviceCommands.createdAt);
    }

    /** Pending commands of devices currently online (flushed when the API (re)connects to the broker). */
    async findPendingForOnlineDevices() {
        return this.db
            .select({ command: deviceCommands })
            .from(deviceCommands)
            .innerJoin(devices, eq(devices.id, deviceCommands.deviceId))
            .where(and(
                eq(deviceCommands.status, "pending"),
                eq(devices.online, true),
                gt(deviceCommands.expiresAt, new Date()),
            ))
            .orderBy(deviceCommands.createdAt);
    }

    /** Returns undefined if the command already moved on (e.g. the ack beat us). */
    async markSent(id: string) {
        const [row] = await this.db
            .update(deviceCommands)
            .set({ status: "sent", sentAt: new Date() })
            .where(and(eq(deviceCommands.id, id), eq(deviceCommands.status, "pending")))
            .returning();
        return row;
    }

    /**
     * Applies a device ack, scoped to that device and only moving forward
     * (a late "acknowledged" never overwrites "succeeded"). Returns the
     * updated row, or undefined if nothing matched.
     */
    async applyAck(input: {
        id: string;
        deviceId: string;
        status: Extract<CommandStatus, "acknowledged" | "succeeded" | "failed">;
        allowedFrom: CommandStatus[];
        result?: Record<string, unknown>;
        error?: string;
    }) {
        const now = new Date();
        const [row] = await this.db
            .update(deviceCommands)
            .set({
                status: input.status,
                result: input.result,
                error: input.error,
                // Keep the first ack time when a "succeeded"/"failed" follows it.
                acknowledgedAt: sql`coalesce(${deviceCommands.acknowledgedAt}, now())`,
                ...(input.status === "acknowledged" ? {} : { completedAt: now }),
            })
            .where(and(
                eq(deviceCommands.id, input.id),
                eq(deviceCommands.deviceId, input.deviceId),
                inArray(deviceCommands.status, input.allowedFrom),
            ))
            .returning();
        return row;
    }

    async expireOverdue(deviceId?: string) {
        await this.db
            .update(deviceCommands)
            .set({ status: "expired" })
            .where(and(
                inArray(deviceCommands.status, ["pending", "sent"]),
                lte(deviceCommands.expiresAt, new Date()),
                ...(deviceId ? [eq(deviceCommands.deviceId, deviceId)] : []),
            ));
    }
}
