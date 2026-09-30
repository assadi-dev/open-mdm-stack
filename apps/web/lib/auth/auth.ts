import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { customSession, jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import * as schema from "@repo/db/schemas/auth-schema";
import { db } from "@repo/db/instance";


export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        customSession(async ({ user, session }) => {
            return {
                user: { ...user, isAdmin: true },
                session,
            }
        }),
        // Permet de signer (auth.api.signJWT) le JWT que le backend exige dans
        // `Authorization: Bearer`. Les clés sont lues dans la table `jwks`, que le
        // backend partage : même base, même BETTER_AUTH_SECRET.
        jwt(),
        // Doit rester le dernier plugin : propage le Set-Cookie de session vers
        // le navigateur quand auth.api.* (ex. signUpEmail) est appelé depuis une
        // Server Action côté serveur (ex. création du premier admin).
        nextCookies(),
    ]
});