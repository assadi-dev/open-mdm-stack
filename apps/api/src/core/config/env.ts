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

  // Android Device Owner provisioning (embedded in the enrollment QR).
  MDM_DPC_COMPONENT: z
    .string()
    .min(1)
    .default("com.openmdm.agent/com.openmdm.agent.device.MdmDeviceAdminReceiver"),
  // URL-safe base64 SHA-256 of the APK signing certificate (dev keystore default).
  MDM_DPC_SIGNATURE_CHECKSUM: z
    .string()
    .min(1)
    .default("uvZWxNiL69K71LKebOhMCv8Jecs7RD5U7yMm5LsRDCw"),
  // HTTPS location the device downloads the agent APK from during provisioning.
  MDM_APK_URL: z.string().min(1).default("http://10.192.2.9:5573/download/apk/app-debug.apk"),
  // Base URL the enrolled device calls back (goes into the QR admin extras).
  MDM_PUBLIC_BASE_URL: z.string().min(1).default("http://10.192.2.9:5573"),
  // Enrollment token lifetime in minutes.
  ENROLLMENT_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).default(60),
});

const result = env_schema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid env variables:", result.error.format());
  process.exit(1);
} else {
  console.log("✅ safe load env variable with success");
}

export const ENV = result.data;
