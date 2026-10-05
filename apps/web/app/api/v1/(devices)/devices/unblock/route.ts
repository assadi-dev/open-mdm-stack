import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { unblockDevicesBodySchema } from "../../schema";
import { DEVICES_ENDPOINTS } from "../endpoints";

// POST /api/v1/devices/unblock  { ids: [...] }
// Plusieurs appareils à la fois : l'API répond 204 et ignore les ids qui n'existent plus ou qui ne sont pas bloqués. Un seul
// appareil passe par `POST /api/v1/device/[id]/unblock`.
export const POST = async (request: NextRequest) => {

    try {
        const input = validateBody(unblockDevicesBodySchema, await readJsonBody(request))
        await httpRequest.post(DEVICES_ENDPOINTS.unblockMany, input)
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return handleApiError(error);
    }
}
