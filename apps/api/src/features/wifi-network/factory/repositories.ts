import { inArray } from "drizzle-orm";
import type { wifiNetworks } from "@drizzle/schemas/wifi-network-schema"
import type { CollectionConfig } from "@features/paginations/domain/interface"
import type { WifiNetworkCollectionQuery } from "../dto/schema"

export const wifiNetworkRepositoryFactory = {
    /**
     * Construit le contenu du `db.select(...)` : une colonne par champ demandé.
     */
    toSelectCollection: (
        table: typeof wifiNetworks,
    ) => {
        return {
            id: table.id,
            name: table.name,
            ssid: table.ssid,
            security: table.security,
            createdAt: table.createdAt,
        }
    },

    /**
     * Ce que `GET /wifi-networks` peut trier, chercher et filtrer, et sur quelles colonnes.
     */
    toCollectionConfig: (
        table: typeof wifiNetworks,
    ): CollectionConfig<WifiNetworkCollectionQuery> => {
        return {
            sortable: { name: table.name, ssid: table.ssid, security: table.security, createdAt: table.createdAt },
            defaultSort: [{ id: "createdAt", desc: true }],
            tieBreaker: table.id,
            searchable: [table.ssid, table.name],
            filters: { security: (values) => inArray(table.security, values) },
        }
    },
}
