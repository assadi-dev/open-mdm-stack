import { z } from "zod";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { toPaginatedSchema } from "@/lib/api/dto/pagination.dto";

// Valeurs de l'enum `wifi_security_type` de l'API, moins `EAP` : la maquette ne propose pas la sécurité d'entreprise.
export const WIFI_SECURITY_KEYS = ["NONE", "WEP", "WPA", "WPA2", "WPA3"] as const;

const SSID_MAX_LENGTH = 32;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 63;

// Ce que `GET /wifi-networks` renvoie pour chaque réseau. `name` est facultatif côté API.
export const wifiNetworkSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  ssid: z.string(),
  security: z.enum(WIFI_SECURITY_KEYS),
  createdAt: z.iso.datetime(),
});

const wifiNetworkCollectionSchema = toPaginatedSchema(wifiNetworkSchema);

type WifiNetworkFormOptions = {
  // À la modification, un mot de passe vide conserve l'actuel, sauf si le réseau était ouvert : il n'en a alors aucun à conserver.
  passwordRequired: boolean;
};

export const buildWifiNetworkFormSchema = ({ passwordRequired }: WifiNetworkFormOptions) =>
  z
    .object({
      // Facultatif : vide, le réseau s'affiche sous son SSID.
      name: z.string().trim(),
      ssid: z
        .string()
        .trim()
        .min(1, WIFI_NETWORK.validation.ssidRequired)
        .max(SSID_MAX_LENGTH, WIFI_NETWORK.validation.ssidTooLong),
      security: z.enum(WIFI_SECURITY_KEYS),
      password: z.string().max(PASSWORD_MAX_LENGTH, WIFI_NETWORK.validation.passwordTooLong),
    })
    .superRefine(({ security, password }, context) => {
      // Un réseau ouvert n'a pas de mot de passe : le champ est désactivé.
      if (security === "NONE") return;
      if (password.length === 0 && !passwordRequired) return;
      if (password.length < PASSWORD_MIN_LENGTH) {
        context.addIssue({ code: "custom", path: ["password"], message: WIFI_NETWORK.validation.passwordTooShort });
      }
    });

export const WifiNetworkDto = {
  parse: (data: unknown) => wifiNetworkSchema.parse(data),
  parseCollection: (data: unknown) => wifiNetworkCollectionSchema.parse(data),
};
