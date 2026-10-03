import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { refreshDevicesBodySchema } from "../../schema";
import { DEVICES_ENDPOINTS } from "../endpoints";

// POST /api/v1/devices/refresh  { ids: [...] }
// Plusieurs appareils à la fois : l'API répond toujours 200, avec le résultat de chacun (`refreshed`, `offline`,
// `timeout`, `notFound` ou `failed`). Un seul appareil passe par `POST /api/v1/device/[id]/refresh`.
export const POST = async (request: NextRequest) => {

    try {
        const input = validateBody(refreshDevicesBodySchema, await readJsonBody(request))
        const results = await httpRequest.post(DEVICES_ENDPOINTS.refreshMany, input)
        return NextResponse.json(results);
    } catch (error) {
        return handleApiError(error);
    }
}
