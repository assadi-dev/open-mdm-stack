import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { updateWifiNetworkBodySchema, wifiNetworkIdSchema } from "../../schema";
import { WIFI_NETWORKS_ENDPOINTS } from "../../wifi-networks/endpoints";

// PATCH /api/v1/wifi-network/[id]  { name?, ssid?, security?, password? }
export const PATCH = async (request: NextRequest, { params }: RouteContext<"/api/v1/wifi-network/[id]">) => {

    try {
        const id = validateBody(wifiNetworkIdSchema, (await params).id)
        const input = validateBody(updateWifiNetworkBodySchema, await readJsonBody(request))
        const wifiNetwork = await httpRequest.patch(WIFI_NETWORKS_ENDPOINTS.item(id), input)
        return NextResponse.json(wifiNetwork);
    } catch (error) {
        return handleApiError(error);
    }
}
