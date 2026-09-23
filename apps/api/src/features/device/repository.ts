import { db as defaultDb } from "@drizzle/instance";
import { devices, enrollmentMethod, enrollmentStatus } from "@drizzle/schemas/device-schema";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export class DeviceRepository {

    /** Accepts a transaction handle so device creation can be committed atomically with challenge consumption. */
    constructor(private readonly db: NodePgDatabase = defaultDb) { }

    async createDevice(input: {
        enrollmentIdentity: string;
        serial: string;
        model: string;
        manufacturer: string;
        release: string;
        sdkVersion: number;
        status: typeof enrollmentStatus[number];
        enrollmentMethod: typeof enrollmentMethod[number];
        androidId?: string;
        brand?: string;
        publicKey?: string;
        agentVersionName?: string;
        agentVersionCode?: number;
        agentPackage?: string;
    }) {
        const [row] = await this.db
            .insert(devices)
            .values({
                enrollmentIdentity: input.enrollmentIdentity,
                serial: input.serial,
                model: input.model,
                manufacturer: input.manufacturer,
                release: input.release,
                sdkVersion: input.sdkVersion,
                enrollmentStatus: input.status,
                enrollmentMethod: input.enrollmentMethod,
                androidId: input.androidId,
                brand: input.brand,
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
     * DeviceService.create): refreshes its reported metadata and the
     * enrollmentIdentity audit stamp, without touching `publicKey`.
     */
    async reEnrollDevice(id: string, input: {
        enrollmentIdentity: string;
        serial?: string;
        model: string;
        manufacturer: string;
        release: string;
        sdkVersion: number;
        enrollmentMethod: typeof enrollmentMethod[number];
        brand?: string;
        agentVersionName?: string;
        agentVersionCode?: number;
        agentPackage?: string;
    }) {
        const [row] = await this.db
            .update(devices)
            .set({
                enrollmentIdentity: input.enrollmentIdentity,
                serial: input.serial,
                model: input.model,
                manufacturer: input.manufacturer,
                release: input.release,
                sdkVersion: input.sdkVersion,
                enrollmentStatus: "enrolled",
                enrollmentMethod: input.enrollmentMethod,
                brand: input.brand,
                agentVersionName: input.agentVersionName,
                agentVersionCode: input.agentVersionCode,
                agentPackage: input.agentPackage,
            })
            .where(eq(devices.id, id))
            .returning();
        return row;
    }

    async setPresence(id: string, online: boolean) {
        await this.db
            .update(devices)
            .set({ online, presenceChangedAt: new Date() })
            .where(eq(devices.id, id));
    }

    /** Updates the screen power state, reported by the device whenever it changes (see CommandService.handleScreen). */
    async setScreenOn(id: string, isScreenOn: boolean) {
        await this.db
            .update(devices)
            .set({ isScreenOn })
            .where(eq(devices.id, id));
    }

    async touchHeartbeat(id: string) {
        await this.db
            .update(devices)
            .set({ lastHeartbeatAt: new Date() })
            .where(eq(devices.id, id));
    }

    /**
     * Refreshes the facts carried on every heartbeat — screen state, IP,
     * SDK/agent version — alongside the last-seen timestamp. The optional
     * fields are omitted by Drizzle when `undefined` (left unchanged), not
     * set to NULL, so a heartbeat that couldn't determine e.g. `ipAddress`
     * doesn't wipe out the last known value.
     */
    async recordHeartbeat(id: string, data: {
        isScreenOn: boolean;
        sdkVersion?: number;
        ipAddress?: string;
        agentVersionName?: string;
        agentVersionCode?: number;
        agentPackage?: string;
    }) {
        await this.db
            .update(devices)
            .set({
                isScreenOn: data.isScreenOn,
                sdkVersion: data.sdkVersion,
                ipAddress: data.ipAddress,
                agentVersionName: data.agentVersionName,
                agentVersionCode: data.agentVersionCode,
                agentPackage: data.agentPackage,
                lastHeartbeatAt: new Date(),
            })
            .where(eq(devices.id, id));
    }
}
