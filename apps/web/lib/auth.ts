import { betterAuth } from "better-auth";

import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";


export const auth = betterAuth({

    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5573",
    plugins: [
        customSession(async ({ user, session }) => {
            return {
                user: { ...user, isAdmin: true },
                session,
            }
        }),
        // Doit rester le dernier plugin : propage le Set-Cookie de session vers
        // le navigateur quand auth.api.* (ex. signUpEmail) est appelé depuis une
        // Server Action côté serveur (ex. création du premier admin).
        nextCookies(),
    ]
});