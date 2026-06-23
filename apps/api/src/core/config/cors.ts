import { CorsOptions } from "cors";
import { ENV } from "@config/env";

const allowedOrigins = ENV.CORS_ORIGIN.split(",").map((o) => o.trim());
export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (origin && allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin ?? "unknown"} not allowed by CORS`));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS", "HEAD", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
};

