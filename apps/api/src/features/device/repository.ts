import { db as defaultDb } from "@drizzle/instance";
import { devices, enrollementStatus } from "@drizzle/schemas/device-schema";
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
        androidId?: string;
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
                androidId: input.androidId,
            })
            .returning();
        return row;
    }

    async findDeviceById(id: string) {
        const [row] = await this.db.select().from(devices).where(eq(devices.id, id)).limit(1);
        return row;
    }

    async touchHeartbeat(id: string) {
        await this.db
            .update(devices)
            .set({ lastHeartbeatAt: new Date() })
            .where(eq(devices.id, id));
    }
}
