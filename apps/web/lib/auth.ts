import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import * as schema from "@repo/db/schemas/auth-schema";
import { db } from "./drizzle/instance";


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
        // Doit rester le dernier plugin : propage le Set-Cookie de session vers
        // le navigateur quand auth.api.* (ex. signUpEmail) est appelé depuis une
        // Server Action côté serveur (ex. création du premier admin).
        nextCookies(),
    ]
});