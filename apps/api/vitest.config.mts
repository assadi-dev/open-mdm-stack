import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Dummy but schema-valid values for the required, no-default fields in
// `@config/env`. Tests never hit S3/Postgres for real (repositories are
// mocked per test), these only exist so `ENV` parses without crashing.
export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: "node",
        include: ["src/**/tests/**/*.test.ts"],
        env: {
            NODE_ENV: "test",
            // supertest requests carry no Origin header; allow all so the CORS
            // middleware doesn't reject same-process e2e requests.
            CORS_ORIGIN: "*",
            S3_ACCESS_KEY: "test-access-key",
            S3_SECRET_KEY: "test-secret-key",
            S3_REGION: "us-east-1",
            S3_ENDPOINT: "http://localhost:9000",
            S3_BUCKET: "test-bucket",
            DATABASE_URL: "postgres://test:test@localhost:5432/test",
            BETTER_AUTH_SECRET: "test-better-auth-secret",
            BETTER_AUTH_URL: "http://localhost:5550",
            MDM_DEVICE_SECRET: "test-mdm-device-secret",
            // Valid Base32 (RFC 4648) — otplib decodes it as the TOTP/HOTP secret.
            MDM_OTP_SECRET: "GEZDGNBVGY3TQOJQGEZDGNBVGY",
            MDM_DPC_SIGNATURE_CHECKSUM: "test-dpc-signature-checksum",
            MQTT_BACKEND_PASSWORD: "test-mqtt-backend-password",
        },
    },
});
