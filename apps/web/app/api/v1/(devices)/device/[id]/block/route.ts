import { handleApiError, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICES_ENDPOINTS } from "../../../devices/endpoints";
import { deviceIdSchema } from "../../../schema";

// POST /api/v1/device/[id]/block  (sans corps)
// L'API bloque l'appareil et renvoie sa ligne mise à jour (`blockedAt` renseigné), ou 404 s'il n'existe pas.
export const POST = async (_request: NextRequest, { params }: RouteContext<"/api/v1/device/[id]/block">) => {

    try {
        const id = validateBody(deviceIdSchema, (await params).id)
        const device = await httpRequest.post(DEVICES_ENDPOINTS.block(id), {})
        return NextResponse.json(device);
    } catch (error) {
        return handleApiError(error);
    }
}
