import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { deleteDevicesBodySchema } from "../schema";
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


// DELETE /api/v1/devices  { ids: [...] }
// Un appareil ou plusieurs : la suppression d'un seul appareil envoie une liste d'un id. L'API supprime les appareils
// et leurs données, et ignore les ids qui n'existent plus.
export const DELETE = async (request: NextRequest) => {

    try {
        const input = validateBody(deleteDevicesBodySchema, await readJsonBody(request))
        await httpRequest.delete(DEVICES_ENDPOINTS.removeMany, { body: JSON.stringify(input) })
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}
