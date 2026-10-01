import { HTTP_ERROR } from "../api/intefaces/http-status";
import { InternalError } from "../api/intefaces/http-errors";
import { auth } from "./auth";

const BACKEND_TOKEN_TTL_SECONDS = 60 * 5;

// Pas de "use server" ici : ce fichier ne doit jamais devenir une Server Action
// appelable depuis le navigateur, il signe des tokens pour le backend.
export const signBackendToken = async (sessionToken: string) => {
    const backendOrigin = process.env.NEXT_PUBLIC_API_URL;
    if (!backendOrigin) {
        throw new InternalError(HTTP_ERROR.INTERNAL_ERROR.message);
    }

    const now = Math.floor(Date.now() / 1000);
    const { token } = await auth.api.signJWT({
        body: {
            payload: {
                sub: sessionToken,
                aud: backendOrigin,
                iss: backendOrigin,
                iat: now,
                exp: now + BACKEND_TOKEN_TTL_SECONDS,
            },
        },
    });
    return token;
};
