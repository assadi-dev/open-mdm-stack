import z from "zod";

const portSchema = z.coerce.number().int().min(1).max(65535).default(5550);

const env_schema = z.object({
  PORT: portSchema,
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000,https://localhost:3000"),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_ENDPOINT: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),
  MDM_AUDIENCE: z.string().min(1).default("openmdm-aud"),

  // Android Device Owner provisioning (embedded in the enrollment QR).
  MDM_PACKAGE_NAME: z
    .string()
    .min(1)
    .default("com.openmdm.agent"),
  MDM_DPC_COMPONENT: z
    .string()
    .min(1)
    .default("com.openmdm.agent/com.openmdm.agent.device.MdmDeviceAdminReceiver"),
  // URL-safe base64 SHA-256 of the APK signing certificate (dev keystore default).
  MDM_DPC_SIGNATURE_CHECKSUM: z
    .string()
    .min(1, "the MDM_DPC_SIGNATURE_CHECKSUM is required"),
  // HTTPS location the device downloads the agent APK from during provisioning.
  MDM_APK_URL: z.string().min(1).default("http://10.192.2.9:5573/download/apk/app-debug.apk"),
  // Base URL the enrolled device calls back (goes into the QR admin extras).
  MDM_SERVER_BASE_URL: z.string().min(1).default("http://10.192.2.120:5573"),
  MDM_DEVICE_SECRET: z.string().min(1),
  MDM_OTP_SECRET: z.string().min(1),
  // Enrollment token lifetime in minutes.
  ENROLLMENT_TOKEN_TTL_SECONDS: z.coerce.number().int().min(1).default(900),
  ENROLLMENT_OTP_TTL_SECONDS: z.coerce.number().int().min(1).default(300),
  ENROLLMENT_MAX_OTP_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  // Anti-replay nonce for the pinned-key enrollment handshake: short-lived,
  // single-use, fetched via GET /devices/enroll/challenge.
  ENROLLMENT_CHALLENGE_TTL_SECONDS: z.coerce.number().int().min(1).default(120),

  // MQTT broker (EMQX, see dependencies/emqx). The API connects as superuser
  // with these credentials; the broker validates them via POST /mqtt/auth.
  MQTT_URL: z.string().min(1).default("mqtt://localhost:1883"),
  MQTT_CLIENT_ID: z.string().min(1).default("mdm-api"),
  MQTT_BACKEND_USERNAME: z.string().min(1).default("mdm-api"),
  MQTT_BACKEND_PASSWORD: z.string().min(16, "MQTT_BACKEND_PASSWORD must be at least 16 chars"),
  // How long an undelivered command stays eligible for (re)delivery.
  COMMAND_TTL_SECONDS: z.coerce.number().int().min(1).default(86400),

});

const result = env_schema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid env variables:", result.error.format());
  process.exit(1);
} else {
  console.log("✅ safe load env variable with success");
}

export const ENV = result.data;
