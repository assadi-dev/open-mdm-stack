import { handleApiError, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICES_ENDPOINTS } from "../../../devices/endpoints";
import { deviceIdSchema } from "../../../schema";

// POST /api/v1/device/[id]/refresh  (sans corps)
// L'API demande à l'appareil de se signaler, attend sa réponse (15 s au plus) et renvoie sa ligne mise à jour.
// Les statuts de l'API sont relayés tels quels : 409 hors ligne, 502 l'appareil a échoué, 503 broker injoignable,
// 504 pas de réponse.
export const POST = async (_request: NextRequest, { params }: RouteContext<"/api/v1/device/[id]/refresh">) => {

    try {
        const id = validateBody(deviceIdSchema, (await params).id)
        const device = await httpRequest.post(DEVICES_ENDPOINTS.refresh(id), {})
        return NextResponse.json(device);
    } catch (error) {
        return handleApiError(error);
    }
}
