import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { DEVICES_ENDPOINTS } from "../../devices/endpoints";
import { deviceIdSchema, updateDeviceBodySchema } from "../../schema";

// Les écritures sont au singulier (`/device`) ; la lecture de la collection au pluriel (`/devices`).

// PATCH /api/v1/device/[id]  { name?, androidVersion?, sdkVersion? }
export const PATCH = async (request: NextRequest, { params }: RouteContext<"/api/v1/device/[id]">) => {

    try {
        const id = validateBody(deviceIdSchema, (await params).id)
        const input = validateBody(updateDeviceBodySchema, await readJsonBody(request))
        const device = await httpRequest.patch(DEVICES_ENDPOINTS.item(id), input)
        return NextResponse.json(device);
    } catch (error) {
        return handleApiError(error);
    }
}
