
import { ENV } from "@config/env";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";


const pool = new Pool({
    connectionString: ENV.DATABASE_URL,
});
export const db = drizzle({ client: pool });