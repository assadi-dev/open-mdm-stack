import "dotenv/config";
import type { Config } from 'drizzle-kit'
import { ENV } from "./src/core/config/env";


export default {
    schema: "src/drizzle/schemas",
    out: "src/drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: ENV.DATABASE_URL,
    },
    verbose: true,
    strict: true,
} satisfies Config