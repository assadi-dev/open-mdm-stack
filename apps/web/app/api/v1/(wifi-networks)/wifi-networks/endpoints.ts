import { withSearchParams } from "@/lib/api/api-handlers";

export const WIFI_NETWORKS_ENDPOINTS = {
    collections: (searchParams?: URLSearchParams) => withSearchParams("wifi-networks", searchParams),
    default: "wifi-network",
    list: "wifi-networks/lists",


}
