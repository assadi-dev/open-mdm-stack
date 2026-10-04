import { handleApiError } from "@/lib/api/api-handlers";
import { httpRequest } from "@/lib/api/api-request";
import { NextResponse } from "next/server";
import { ENROLLMENT_ENDPOINTS } from "../endpoints";

// POST /api/v1/enrollment/code
// Génère le code à 6 chiffres à saisir dans l'agent → `{ code, expiresAt, ttl }`. Un POST côté proxy bien que l'API
// réponde en GET : chaque appel crée un nouveau code, la requête n'est ni idempotente ni à mettre en cache.
export const POST = async () => {
    try {
        const code = await httpRequest.get(ENROLLMENT_ENDPOINTS.code, { cache: "no-store" });
        return NextResponse.json(code);
    } catch (error) {
        return handleApiError(error);
    }
}
