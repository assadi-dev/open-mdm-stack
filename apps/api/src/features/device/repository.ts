import { db as defaultDb } from "@drizzle/instance";
import { deviceOverview } from "@drizzle/schemas/device-overview-view";
import { devices, enrollmentMethod, enrollmentStatus } from "@drizzle/schemas/device-schema";
import {
    deviceTelemetry,
    DeviceBatteryTelemetry,
    DeviceLocationTelemetry,
    DeviceMemoryTelemetry,
    DeviceNetworkTelemetry,
    DeviceStorageTelemetry,
    DEFAULT_MEMORY_TELEMETRY,
    DEFAULT_STORAGE_TELEMETRY,
    DEFAULT_BATTERY_TELEMETRY,
    DEFAULT_LOCATION_TELEMETRY,
} from "@drizzle/schemas/device-telemetry-schema";
import { and, asc, count, desc, eq, inArray, isNotNull, max, ne } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { buildPaginatedData, toCollectionClauses } from "@features/paginations/services";
import type { DeviceCollectionQuery } from "./dto/schema";
import { deviceRepositoryFactory } from "./factory/repositories";
import { HTTPNotFoundException } from "@core/exception";
import { DeleteDeviceResult } from "./entities/repositories";

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
        /** The name given at enrollment (provisioning QR). Left out, the device has none: `null`. */
        name?: string | null;
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
                name: input.name ?? null,
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
     * enrollmentIdentity audit stamp, without touching `publicKey`. `name` follows the
     * convention of an update: left out, the current name (possibly typed by an admin)
     * is kept; a value replaces it; `null` clears it.
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
        name?: string | null;
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
                name: input.name,
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
     * Android/SDK/agent version — alongside the last-seen timestamp. The optional
     * fields are omitted by Drizzle when `undefined` (left unchanged), not
     * set to NULL, so a heartbeat that couldn't determine e.g. `ipAddress`
     * doesn't wipe out the last known value.
     */
    async recordHeartbeat(id: string, data: {
        isScreenOn: boolean;
        sdkVersion?: number;
        release?: string;
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
                release: data.release,
                ipAddress: data.ipAddress,
                agentVersionName: data.agentVersionName,
                agentVersionCode: data.agentVersionCode,
                agentPackage: data.agentPackage,
                lastHeartbeatAt: new Date(),
            })
            .where(eq(devices.id, id));
    }

    /** Overwrites the device's telemetry snapshot from an inventory push — no history, one row per device. */
    async upsertTelemetry(deviceId: string, data: {
        network: DeviceNetworkTelemetry;
        memory: DeviceMemoryTelemetry;
        storage: DeviceStorageTelemetry;
        battery: DeviceBatteryTelemetry;
        location: DeviceLocationTelemetry;
    }) {
        await this.db
            .insert(deviceTelemetry)
            .values({ deviceId, ...data })
            .onConflictDoUpdate({
                target: deviceTelemetry.deviceId,
                set: { ...data, updatedAt: new Date() },
            });
    }

    /**
     * Partial telemetry update (see PATCH /devices/:deviceId/telemetry):
     * only the groups present in `patch` are touched, and each is *merged*
     * into what's already stored, not replaced wholesale — e.g. patching
     * `{ battery: { level: 50 } }` keeps the existing `charging`/`health`.
     * Checks existence first: creates the row (missing groups falling back
     * to their column defaults) if none exists yet, updates it otherwise.
     */
    async patchTelemetry(deviceId: string, patch: {
        network?: Partial<DeviceNetworkTelemetry>;
        memory?: Partial<DeviceMemoryTelemetry>;
        storage?: Partial<DeviceStorageTelemetry>;
        battery?: Partial<DeviceBatteryTelemetry>;
        location?: Partial<DeviceLocationTelemetry>;
    }) {
        const [current] = await this.db
            .select()
            .from(deviceTelemetry)
            .where(eq(deviceTelemetry.deviceId, deviceId))
            .limit(1);

        if (!current) {
            await this.db.insert(deviceTelemetry).values({
                deviceId,
                network: patch.network as DeviceNetworkTelemetry | undefined,
                memory: patch.memory && { ...DEFAULT_MEMORY_TELEMETRY, ...patch.memory },
                storage: patch.storage && { ...DEFAULT_STORAGE_TELEMETRY, ...patch.storage },
                battery: patch.battery && { ...DEFAULT_BATTERY_TELEMETRY, ...patch.battery },
                location: patch.location && { ...DEFAULT_LOCATION_TELEMETRY, ...patch.location },
            });
            return;
        }

        await this.db
            .update(deviceTelemetry)
            .set({
                network: patch.network && { ...current.network, ...patch.network } as DeviceNetworkTelemetry,
                memory: patch.memory && { ...current.memory, ...patch.memory },
                storage: patch.storage && { ...current.storage, ...patch.storage },
                battery: patch.battery && { ...current.battery, ...patch.battery },
                location: patch.location && { ...current.location, ...patch.location },
                updatedAt: new Date(),
            })
            .where(eq(deviceTelemetry.deviceId, deviceId));
    }

    /** One row of the devices list (see `device_overview`), or undefined when the device doesn't exist or isn't listed. */
    async findOverviewById(id: string) {
        const selection = deviceRepositoryFactory.toSelectCollection(deviceOverview);
        const [row] = await this.db.select(selection).from(deviceOverview).where(eq(deviceOverview.id, id)).limit(1);
        return row;
    }

    /**
     * Admin edit of the label and of the identity facts a device reports. A key left `undefined` leaves its column
     * unchanged (Drizzle omits it), `null` clears it.
     */
    async update(id: string, patch: {
        name?: string | null;
        release?: string | null;
        sdkVersion?: number | null;
        androidId?: string | null;
    }) {
        await this.db.update(devices).set(patch).where(eq(devices.id, id));
    }

    /** Marks the listed (pending or enrolled) devices among `ids` as unenrolled. Any other id is left alone. */
    async unenroll(ids: string[]) {
        await this.db
            .update(devices)
            .set({ enrollmentStatus: "unenrolled" })
            .where(and(inArray(devices.id, ids), inArray(devices.enrollmentStatus, ["pending", "enrolled"])));
    }

    /** One page of the devices list (see the `device_overview` view), with the total after search and filters. */
    async collection(collectionQuery: DeviceCollectionQuery) {
        const selection = deviceRepositoryFactory.toSelectCollection(deviceOverview);
        const config = deviceRepositoryFactory.toCollectionConfig(deviceOverview);
        const { where, orderBy, limit, offset } = toCollectionClauses(collectionQuery, config);

        const [data, total] = await Promise.all([
            this.db.select(selection).from(deviceOverview).where(where).orderBy(...orderBy).limit(limit).offset(offset),
            this.db.$count(deviceOverview, where),
        ]);
        return buildPaginatedData(data, { page: collectionQuery.page, limit, total });
    }

    /**
     * Counts over the whole listed fleet, never narrowed by search or filters:
     * how many devices per status, and per Android version (newest first).
     */
    async summary() {
        const [byStatus, androidVersions, brands, models] = await Promise.all([
            this.db
                .select({ status: deviceOverview.status, count: count() })
                .from(deviceOverview)
                .groupBy(deviceOverview.status),
            this.db
                .select({
                    sdkVersion: deviceOverview.sdkVersion,
                    androidVersion: max(deviceOverview.release),
                    count: count(),
                })
                .from(deviceOverview)
                .where(isNotNull(deviceOverview.sdkVersion))
                .groupBy(deviceOverview.sdkVersion)
                .orderBy(desc(deviceOverview.sdkVersion)),
            this.db
                .selectDistinct({ value: deviceOverview.brand })
                .from(deviceOverview)
                .where(and(isNotNull(deviceOverview.brand), ne(deviceOverview.brand, "")))
                .orderBy(asc(deviceOverview.brand)),
            this.db
                .selectDistinct({ value: deviceOverview.model })
                .from(deviceOverview)
                .where(and(isNotNull(deviceOverview.model), ne(deviceOverview.model, "")))
                .orderBy(asc(deviceOverview.model)),
        ]);
        return {
            byStatus,
            androidVersions,
            brands: brands.flatMap(({ value }) => (value ? [value] : [])),
            models: models.flatMap(({ value }) => (value ? [value] : [])),
        };
    }

    async delete(id: string) {
        const [row] = await this.db.delete(devices).where(eq(devices.id, id)).returning();
        if (!row) {
            throw new HTTPNotFoundException(`Device with id ${id} not found`);
        }
        await this.db.delete(devices).where(eq(devices.id, row.id))
    }

    async deleteMany(ids: string[]): Promise<DeleteDeviceResult> {
        const results: DeleteDeviceResult = {
            success: [],
            failures: []
        }
        for (const id of ids) {
            try {
                await this.delete(id)
                results.success.push(id)
            } catch (error) {
                results.failures.push({ id, reason: error.message })
            }
        }
        return results
    }
}
