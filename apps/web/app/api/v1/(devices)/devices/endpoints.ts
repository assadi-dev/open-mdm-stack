import { withSearchParams } from "@/lib/api/api-handlers";

// Les chemins de l'API backend : la liste paginée et le résumé du parc.
export const DEVICES_ENDPOINTS = {
    collections: (searchParams?: URLSearchParams) => withSearchParams("devices", searchParams),
    summary: "devices/summary",
}
