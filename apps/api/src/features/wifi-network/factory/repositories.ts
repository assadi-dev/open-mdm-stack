import type { wifiNetworks } from "@drizzle/schemas/wifi-network-schema"

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
}
