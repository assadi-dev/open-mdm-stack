import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { deleteWifiNetworksBodySchema } from "../schema";
import { WIFI_NETWORKS_ENDPOINTS } from "./endpoints";


// GET /api/v1/wifi-networks?page&limit&search&sort&security
export const GET = async (request: NextRequest) => {

    try {

        const wifiNetworks = await httpRequest.get(WIFI_NETWORKS_ENDPOINTS.collections(request.nextUrl.searchParams))
        return NextResponse.json(wifiNetworks);
    } catch (error) {
        return handleApiError(error);
    }
}


// DELETE /api/v1/wifi-networks  { ids: [...] }
// Un réseau ou plusieurs : la suppression d'un seul réseau envoie une liste d'un id. L'API ignore les ids qui n'existent plus.
export const DELETE = async (request: NextRequest) => {

    try {
        const input = validateBody(deleteWifiNetworksBodySchema, await readJsonBody(request))
        await httpRequest.delete(WIFI_NETWORKS_ENDPOINTS.removeMany, { body: JSON.stringify(input) })
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}
