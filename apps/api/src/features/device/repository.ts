import { db as defaultDb } from "@drizzle/instance";
import { devices, enrollementMethod, enrollementStatus } from "@drizzle/schemas/device-schema";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export class DeviceRepository {

    /** Accepts a transaction handle so device creation can be committed atomically with token consumption. */
    constructor(private readonly db: NodePgDatabase = defaultDb) { }

    async createDevice(input: {
        enrollmentId: string;
        serial: string;
        model: string;
        manufacturer: string;
        osVersion: string;
        status: typeof enrollementStatus[number];
        enrollementMethod: typeof enrollementMethod[number];
        androidId?: string;
        publicKey?: string;
        agentVersionName?: string;
        agentVersionCode?: number;
        agentPackage?: string;
    }) {
        const [row] = await this.db
            .insert(devices)
            .values({
                enrollmentId: input.enrollmentId,
                serial: input.serial,
                model: input.model,
                manufacturer: input.manufacturer,
                osVersion: input.osVersion,
                enrollementStatus: input.status,
                enrollementMethod: input.enrollementMethod,
                androidId: input.androidId,
                publicKey: input.publicKey,
                agentVersionName: input.agentVersionName,
                agentVersionCode: input.agentVersionCode,
                agentPackage: input.agentPackage,
            })
            .returning();
        return row;
    }

    async findDeviceById(id: string) {
        const [row] = await this.db.select().from(devices).where(eq(devices.id, id)).limit(1);
        return row;
    }

    async findByAndroidId(androidId: string) {
        const [row] = await this.db.select().from(devices).where(eq(devices.androidId, androidId)).limit(1);
        return row;
    }

    /**
     * Re-enrolls a device whose pinned public key matched (see
     * DeviceService.create): links it to the new enrollment token and
     * refreshes its reported metadata, without touching `publicKey`.
     */
    async reEnrollDevice(id: string, input: {
        enrollmentId: string;
        serial?: string;
        model: string;
        manufacturer: string;
        osVersion: string;
        enrollementMethod: typeof enrollementMethod[number];
        agentVersionName?: string;
        agentVersionCode?: number;
        agentPackage?: string;
    }) {
        const [row] = await this.db
            .update(devices)
            .set({
                enrollmentId: input.enrollmentId,
                serial: input.serial,
                model: input.model,
                manufacturer: input.manufacturer,
                osVersion: input.osVersion,
                enrollementStatus: "enrolled",
                enrollementMethod: input.enrollementMethod,
                agentVersionName: input.agentVersionName,
                agentVersionCode: input.agentVersionCode,
                agentPackage: input.agentPackage,
            })
            .where(eq(devices.id, id))
            .returning();
        return row;
    }

    async touchHeartbeat(id: string) {
        await this.db
            .update(devices)
            .set({ lastHeartbeatAt: new Date() })
            .where(eq(devices.id, id));
    }
}
