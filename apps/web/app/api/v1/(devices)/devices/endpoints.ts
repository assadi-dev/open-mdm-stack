import { withSearchParams } from "@/lib/api/api-handlers";

// Les chemins de l'API backend : la liste paginée, le résumé du parc, un appareil, et l'actualisation, le blocage et le
// déblocage d'un ou de plusieurs.
export const DEVICES_ENDPOINTS = {
    collections: (searchParams?: URLSearchParams) => withSearchParams("devices", searchParams),
    summary: "devices/summary",
    item: (id: string) => `devices/${id}`,
    removeMany: "devices",
    refresh: (id: string) => `devices/${id}/refresh`,
    refreshMany: "devices/refresh",
    block: (id: string) => `devices/${id}/block`,
    blockMany: "devices/block",
    unblock: (id: string) => `devices/${id}/unblock`,
    unblockMany: "devices/unblock",
}
