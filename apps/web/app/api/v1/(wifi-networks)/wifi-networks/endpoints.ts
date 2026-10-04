import { withSearchParams } from "@/lib/api/api-handlers";

export const WIFI_NETWORKS_ENDPOINTS = {
    collections: (searchParams?: URLSearchParams) => withSearchParams("wifi-networks", searchParams),
    create: "wifi-networks",
    item: (id: string) => `wifi-networks/${id}`,
    removeMany: "wifi-networks",
    default: "wifi-network",
    list: "wifi-networks/lists",


}
