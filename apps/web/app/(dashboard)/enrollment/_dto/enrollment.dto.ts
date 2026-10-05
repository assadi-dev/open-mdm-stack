import { z } from "zod";
import { ENROLLMENT } from "@/constants/enrollment";
import { toPaginatedSchema } from "@/lib/api/dto/pagination.dto";

// Les onglets de la page, gardés dans l'URL (`?method=manual`).
export const ENROLLMENT_METHOD_KEYS = ["qr", "manual"] as const;

// La limite du nom d'un appareil côté API (`updateDeviceSchema`).
const NAME_MAX_LENGTH = 100;

const httpUrlSchema = z.url({ protocol: /^https?$/ });

// Un réseau Wi-Fi enregistré, tel que le formulaire le propose : l'id (un `uuid`, l'API le résout) et de quoi le reconnaître.
const enrollmentWifiNetworkSchema = z.object({ id: z.string(), ssid: z.string(), security: z.string() });

// Ce que `GET /wifi-networks` renvoie, réduit à ce que la liste déroulante lit.
const enrollmentWifiNetworkCollectionSchema = toPaginatedSchema(enrollmentWifiNetworkSchema);

// Les choix du formulaire « Configuration » : groupes, politiques et réseaux Wi-Fi enregistrés.
export const enrollmentOptionsSchema = z.object({
  groups: z.array(z.object({ id: z.string(), name: z.string() })),
  policies: z.array(z.object({ id: z.string(), name: z.string(), version: z.number().int().positive() })),
  wifiNetworks: z.array(enrollmentWifiNetworkSchema),
  // Ce que le formulaire propose à l'ouverture et retrouve après « Réinitialiser ».
  defaults: z.object({ name: z.string(), groupId: z.string(), policyId: z.string() }),
});

// Le QR code de provisioning : le document SVG que l'API génère. Elle ne renvoie ni lien ni date d'expiration : le QR
// code n'embarque que la configuration, aucun jeton.
export const enrollmentQrSchema = z.object({
  svg: z.string().startsWith("<svg"),
});

// Ce que `GET /enrollment/otp-generate` renvoie : le code à 6 chiffres que l'agent saisit, et sa durée de vie.
export const enrollmentCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  expiresAt: z.iso.datetime(),
  ttl: z.number().int().positive(),
});

// L'appareil branché en USB et autorisé en ADB. Le descripteur USB donne la marque, le modèle et le numéro de série ;
// la version d'Android sera lue par ADB (`null` d'ici là).
export const usbDeviceSchema = z.object({
  brand: z.string().nullable(),
  model: z.string(),
  serial: z.string(),
  androidVersion: z.string().nullable(),
  adbAuthorized: z.boolean(),
});

// Le formulaire manipule des textes : un réseau Wi-Fi absent vaut `NO_WIFI`, une URL vide laisse l'APK par défaut.
export const enrollmentConfigFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, ENROLLMENT.validation.nameRequired)
    .max(NAME_MAX_LENGTH, ENROLLMENT.validation.nameTooLong),
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
};
