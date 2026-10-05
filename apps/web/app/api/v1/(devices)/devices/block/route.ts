import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { blockDevicesBodySchema } from "../../schema";
import { DEVICES_ENDPOINTS } from "../endpoints";

// POST /api/v1/devices/block  { ids: [...] }
// Plusieurs appareils à la fois : l'API répond 204 et ignore les ids qui n'existent plus ou déjà bloqués. Un seul
// appareil passe par `POST /api/v1/device/[id]/block`.
export const POST = async (request: NextRequest) => {

    try {
        const input = validateBody(blockDevicesBodySchema, await readJsonBody(request))
        await httpRequest.post(DEVICES_ENDPOINTS.blockMany, input)
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}
