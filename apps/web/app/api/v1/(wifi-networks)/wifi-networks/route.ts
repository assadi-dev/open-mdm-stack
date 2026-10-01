import { handleApiError } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
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


