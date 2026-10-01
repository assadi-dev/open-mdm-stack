import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { createWifiNetworkBodySchema } from "../schema";
import { WIFI_NETWORKS_ENDPOINTS } from "../wifi-networks/endpoints";

// Les écritures sont au singulier (`/wifi-network`) ; la lecture de la collection et la suppression groupée au pluriel (`/wifi-networks`).

// POST /api/v1/wifi-network  { name?, ssid, security, password? }
export const POST = async (request: NextRequest) => {

    try {
        const input = validateBody(createWifiNetworkBodySchema, await readJsonBody(request))
        const wifiNetwork = await httpRequest.post(WIFI_NETWORKS_ENDPOINTS.create, input)
        return NextResponse.json(wifiNetwork, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
