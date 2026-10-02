import { handleApiError } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse } from "next/server";
import { DEVICES_ENDPOINTS } from "../endpoints";


// GET /api/v1/devices/summary : le nombre d'appareils par statut et par version d'Android, sur tout le parc.
export const GET = async () => {

    try {
        const summary = await httpRequest.get(DEVICES_ENDPOINTS.summary)
        return NextResponse.json(summary);
    } catch (error) {
        return handleApiError(error);
    }
}
