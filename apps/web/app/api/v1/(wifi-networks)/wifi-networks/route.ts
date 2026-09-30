import { handleApiError } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse } from "next/server";
import { WIFI_NETWORKS_ENDPOINTS } from "./endpoints";


export const GET = async () => {

    try {

        const wifiNetworks = await httpRequest.get(WIFI_NETWORKS_ENDPOINTS.list)
        return NextResponse.json(wifiNetworks);
    } catch (error) {
        return handleApiError(error);
    }
}