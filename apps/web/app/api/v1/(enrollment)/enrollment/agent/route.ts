import { handleApiError, validateBody } from "@/lib/api/api-handlers";
import { BadGateway, InternalError, Unauthorized } from "@/lib/api/intefaces/http-errors";
import { HTTP_ERROR } from "@/lib/api/intefaces/http-status";
import { getSessionServer } from "@/lib/auth/session-server";
import type { NextRequest } from "next/server";
import { agentDownloadQuerySchema } from "../../schema";

const APK_MEDIA_TYPE = "application/vnd.android.package-archive";
const APK_FILE_NAME = "openmdm-agent.apk";

// GET /api/v1/enrollment/agent?apkUrl=...
// Sert l'APK de l'agent : celui de `apkUrl`, sinon celui du serveur (`NEXT_PUBLIC_AGENT_APK_URL`). Le navigateur passe par
// Next plutôt que de joindre le serveur de fichiers : pas de CORS, et pas de contenu HTTP bloqué depuis une page HTTPS.
// L'APK est relayé en flux, sans être gardé en mémoire.
export const GET = async (request: NextRequest) => {
    try {
        // Le proxy n'est pas un relais ouvert : il faut une session, comme pour tout appel vers l'API.
        if (!(await getSessionServer())) throw new Unauthorized(HTTP_ERROR.UNAUTHORIZED.message);

        const { apkUrl } = validateBody(agentDownloadQuerySchema, Object.fromEntries(request.nextUrl.searchParams));
        const source = apkUrl ?? process.env.NEXT_PUBLIC_AGENT_APK_URL;
        if (!source) throw new InternalError(HTTP_ERROR.INTERNAL_ERROR.message);

        const upstream = await fetch(source, { cache: "no-store", signal: request.signal }).catch(() => {
            throw new BadGateway(HTTP_ERROR.BAD_GATEWAY.message);
        });
        if (!upstream.ok || !upstream.body) throw new BadGateway(HTTP_ERROR.BAD_GATEWAY.message);

        const headers = new Headers({
            "Content-Type": APK_MEDIA_TYPE,
            "Content-Disposition": `attachment; filename="${APK_FILE_NAME}"`,
            "Cache-Control": "no-store",
        });
        // La taille est celle du fichier envoyé : elle n'est plus la même si `fetch` a décompressé la réponse.
        const length = upstream.headers.get("content-length");
        if (length && !upstream.headers.get("content-encoding")) headers.set("Content-Length", length);

        return new Response(upstream.body, { headers });
    } catch (error) {
        return handleApiError(error);
    }
}
