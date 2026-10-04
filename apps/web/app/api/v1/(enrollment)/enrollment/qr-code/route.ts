import { handleApiError, readJsonBody, validateBody } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse, type NextRequest } from "next/server";
import { createEnrollmentQrBodySchema } from "../../schema";
import { ENROLLMENT_ENDPOINTS } from "../endpoints";


// POST /api/v1/enrollment/qr-code  { name?, groupId?, policyId?, wifiId?, apkUrl? }
// Génère un QR code d'enrôlement. L'API répond avec un document SVG : le proxy le renvoie dans un objet JSON, pour
// que la réponse puisse porter d'autres champs plus tard.
export const POST = async (request: NextRequest) => {

    try {
        const input = validateBody(createEnrollmentQrBodySchema, await readJsonBody(request))
        const svg = await httpRequest.postText(ENROLLMENT_ENDPOINTS.qrCode, input)
        return NextResponse.json({ svg });
    } catch (error) {
        return handleApiError(error);
    }
}
