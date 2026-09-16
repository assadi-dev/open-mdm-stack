import { db } from "@drizzle/instance";
import { devices, enrollementStatus, enrollmentTokens } from "@drizzle/schemas/device-schema";
import { and, eq, gt, isNull, or } from "drizzle-orm";

export class DeviceRepository {


    async createDevice(input: {
        enrollmentId: string;
        serial: string;
        model: string;
        manufacturer: string;
        osVersion: string;
        status: typeof enrollementStatus[number];
        androidId: string;
    }) {

    }

    async findDeviceById(id: string) {
        const [row] = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
        return row;
    }

    async touchHeartbeat(id: string) {
        await db
            .update(devices)
            .set({ lastHeartbeatAt: new Date() })
            .where(eq(devices.id, id));
    }
}
