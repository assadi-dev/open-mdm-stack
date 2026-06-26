import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { ENV } from "@config/env"
import { jwt } from "better-auth/plugins"
import { db } from "src/drizzle/instance";
import * as schema from "@schemas/auth-schema";


export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [jwt()],
    user: {
        deleteUser: {
            enabled: true,
        }
    },

})