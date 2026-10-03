import { inArray } from "drizzle-orm";
import type { deviceOverview } from "@drizzle/schemas/device-overview-view";
import type { CollectionConfig } from "@features/paginations/domain/interface";
import type { DeviceCollectionQuery } from "../dto/schema";

export const deviceRepositoryFactory = {
    /**
     * Builds the `db.select(...)` of the devices list: one entry per field of
     * the API row. Never the table itself — imei, mac address and public key
     * stay out of the list.
     */
    toSelectCollection: (
        view: typeof deviceOverview,
    ) => {
        return {
            id: view.id,
            name: view.name,
            displayName: view.displayName,
            serial: view.serial,
            androidId: view.androidId,
            model: view.model,
            brand: view.brand,
            androidVersion: view.release,
            sdkVersion: view.sdkVersion,
            assignedToUserId: view.assignedToUserId,
            assignedToName: view.assignedToName,
            status: view.status,
            battery: view.battery,
            lastHeartbeatAt: view.lastHeartbeatAt,
            presenceChangedAt: view.presenceChangedAt,
            createdAt: view.createdAt,
        }
    },

    /**
     * What `GET /devices` can sort, search and filter, and on which columns of the view.
     */
    toCollectionConfig: (
        view: typeof deviceOverview,
    ): CollectionConfig<DeviceCollectionQuery> => {
        return {
            sortable: {
                displayName: view.displayName,
                model: view.model,
                serial: view.serial,
                assignedToName: view.assignedToName,
                sdkVersion: view.sdkVersion,
                battery: view.battery,
                lastHeartbeatAt: view.lastHeartbeatAt,
                presenceChangedAt: view.presenceChangedAt,
                createdAt: view.createdAt,
            },
            defaultSort: [{ id: "createdAt", desc: true }],
            tieBreaker: view.id,
            searchable: [view.displayName, view.model, view.serial, view.androidId, view.brand, view.assignedToName],
            filters: {
                status: (values) => inArray(view.status, values),
                sdkVersion: (values) => inArray(view.sdkVersion, values),
            },
        }
    },
}
