import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { ENV } from "@config/env"
import { jwt } from "better-auth/plugins"
import { db } from "src/drizzle/instance";


export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    plugins: [jwt()],
    user: {
        deleteUser: {
            enabled: true,
        }
    },
    trustedOrigins: [ENV.BETTER_AUTH_SECRET]
})