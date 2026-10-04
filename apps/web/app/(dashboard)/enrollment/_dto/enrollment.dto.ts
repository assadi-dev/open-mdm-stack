import { z } from "zod";
import { ENROLLMENT } from "@/constants/enrollment";
import { toPaginatedSchema } from "@/lib/api/dto/pagination.dto";

// Les onglets de la page, gardés dans l'URL (`?method=manual`).
export const ENROLLMENT_METHOD_KEYS = ["qr", "manual"] as const;

// La limite du nom d'un appareil côté API (`updateDeviceSchema`).
const NAME_PATTERN_MAX_LENGTH = 100;

const httpUrlSchema = z.url({ protocol: /^https?$/ });

// Un réseau Wi-Fi enregistré, tel que le formulaire le propose : l'id (un `uuid`, l'API le résout) et de quoi le reconnaître.
const enrollmentWifiNetworkSchema = z.object({ id: z.string(), ssid: z.string(), security: z.string() });

// Ce que `GET /wifi-networks` renvoie, réduit à ce que la liste déroulante lit.
const enrollmentWifiNetworkCollectionSchema = toPaginatedSchema(enrollmentWifiNetworkSchema);

// Les choix du formulaire « Configuration » : groupes, politiques, réseaux Wi-Fi enregistrés, et l'agent servi par défaut.
export const enrollmentOptionsSchema = z.object({
  groups: z.array(z.object({ id: z.string(), name: z.string() })),
  policies: z.array(z.object({ id: z.string(), name: z.string(), version: z.number().int().positive() })),
  wifiNetworks: z.array(enrollmentWifiNetworkSchema),
  agent: z.object({ version: z.string(), apkUrl: z.url() }),
  // Ce que le formulaire propose à l'ouverture et retrouve après « Réinitialiser ».
  defaults: z.object({ namePattern: z.string(), groupId: z.string(), policyId: z.string() }),
});

// Le QR code de provisioning : le document SVG que l'API génère. Elle ne renvoie ni lien ni date d'expiration : le QR
// code n'embarque que la configuration, aucun jeton.
export const enrollmentQrSchema = z.object({
  svg: z.string().startsWith("<svg"),
});

// Ce que `GET /enrollment/otp-generate` renvoie : le code à 6 chiffres que l'agent saisit, et sa durée de vie.
export const enrollmentCodeSchema = z.object({
  token: z.string().regex(/^\d{6}$/),
  expiresAt: z.iso.datetime(),
  ttl: z.number().int().positive(),
});

// L'appareil branché en USB, tel que l'ADB du navigateur le décrit.
export const usbDeviceSchema = z.object({
  brand: z.string().nullable(),
  model: z.string(),
  serial: z.string(),
  androidVersion: z.string(),
  adbAuthorized: z.boolean(),
});

// Le résultat d'un enrôlement par USB : l'appareil créé dans le parc.
export const usbEnrollmentSchema = z.object({
  deviceId: z.string(),
});

// Le formulaire manipule des textes : un réseau Wi-Fi absent vaut `NO_WIFI`, une URL vide laisse l'APK par défaut.
export const enrollmentConfigFormSchema = z.object({
  namePattern: z
    .string()
    .trim()
    .min(1, ENROLLMENT.validation.namePatternRequired)
    .max(NAME_PATTERN_MAX_LENGTH, ENROLLMENT.validation.namePatternTooLong),
  groupId: z.string().min(1, ENROLLMENT.validation.groupRequired),
  policyId: z.string().min(1, ENROLLMENT.validation.policyRequired),
  wifiId: z.string(),
  apkUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || httpUrlSchema.safeParse(value).success, ENROLLMENT.validation.apkUrlInvalid),
});

export const EnrollmentDto = {
  parseOptions: (data: unknown) => enrollmentOptionsSchema.parse(data),
  parseWifiNetworks: (data: unknown) => enrollmentWifiNetworkCollectionSchema.parse(data),
  parseQr: (data: unknown) => enrollmentQrSchema.parse(data),
  parseCode: (data: unknown) => enrollmentCodeSchema.parse(data),
  parseUsbDevice: (data: unknown) => usbDeviceSchema.parse(data),
  parseUsbEnrollment: (data: unknown) => usbEnrollmentSchema.parse(data),
};
