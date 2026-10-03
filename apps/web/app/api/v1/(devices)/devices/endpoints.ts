import { withSearchParams } from "@/lib/api/api-handlers";

// Les chemins de l'API backend : la liste paginée, le résumé du parc et un appareil.
export const DEVICES_ENDPOINTS = {
    collections: (searchParams?: URLSearchParams) => withSearchParams("devices", searchParams),
    summary: "devices/summary",
    item: (id: string) => `devices/${id}`,
}
