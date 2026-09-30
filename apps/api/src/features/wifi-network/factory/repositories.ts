import type { WifiNetworkSqlInferSelect } from "@drizzle/schemas/wifi-network-schema"

type WifiNetworkCollectionRow = Pick<
    WifiNetworkSqlInferSelect,
    "id" | "name" | "security" | "createdAt"
>

export const wifiNetworkRepositoryFactory = {
    toCollection: (row: WifiNetworkCollectionRow) => ({
        id: row.id,
        name: row.name,
        security: row.security,
        createdAt: row.createdAt.toISOString(),
    }),
}
