import { handleApiError } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICES_ENDPOINTS } from "./endpoints";


// GET /api/v1/devices?page&limit&search&sort&status&sdkVersion
// La query string est relayée telle quelle : c'est l'API qui la valide.
export const GET = async (request: NextRequest) => {

    try {
        const devices = await httpRequest.get(DEVICES_ENDPOINTS.collections(request.nextUrl.searchParams))
        return NextResponse.json(devices);
    } catch (error) {
        return handleApiError(error);
    }
}
