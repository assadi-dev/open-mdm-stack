import type { ComponentProps } from "react";
import type { Badge } from "@/components/badges/Badge";
import { WIFI_NETWORK } from "@/constants/wifi-network";
import { formatNumber } from "@/lib/format";
import { WIFI_SECURITY_KEYS } from "../_dto/wifi-network.dto";
import type {
  CreateWifiNetworkInput,
  UpdateWifiNetworkInput,
  WifiNetworkFormValues,
  WifiSecurity,
  WifiSecurityOption,
} from "../_types/wifi-network.types";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

// Un réseau ouvert ou chiffré par un protocole abandonné expose les appareils : la couleur le signale, le libellé nomme toujours le protocole.
const SECURITY_VARIANTS: Record<WifiSecurity, BadgeVariant> = {
  NONE: "danger",
  WEP: "warning",
  WPA: "warning",
  WPA2: "secondary",
  WPA3: "secondary",
};

export const SECURITY_OPTIONS: WifiSecurityOption[] = (
  Object.entries(WIFI_NETWORK.security) as [WifiSecurity, string][]
).map(([value, label]) => ({ value, label }));

export const isWifiSecurity = (value: unknown): value is WifiSecurity =>
  WIFI_SECURITY_KEYS.includes(value as WifiSecurity);

export const toSecurityVariant =(security: WifiSecurity) => SECURITY_VARIANTS[security];

export const toWifiNetworksSubtitle = (registeredCount: number) => {
  const { registered } = WIFI_NETWORK.page.subtitle;
  return `${formatNumber(registeredCount)} ${registeredCount > 1 ? registered.many : registered.one}`;
};

export const toResultsLabel = (count: number) =>
  `${formatNumber(count)} ${count > 1 ? WIFI_NETWORK.results.many : WIFI_NETWORK.results.one}`;

export const toDeleteTitle = (ssid: string) => `${WIFI_NETWORK.dialog.delete.title} « ${ssid} » ?`;

// Le mot de passe part seulement s'il est saisi et utile : un réseau ouvert n'en a pas, un champ vide conserve l'actuel.
const toPassword = ({ security, password }: WifiNetworkFormValues) =>
  security !== "NONE" && password.length > 0 ? { password } : {};

export const toCreateInput = (values: WifiNetworkFormValues): CreateWifiNetworkInput => ({
  ssid: values.ssid,
  security: values.security,
  ...toPassword(values),
});

export const toUpdateInput = (id: string, values: WifiNetworkFormValues): UpdateWifiNetworkInput => ({
  id,
  ...toCreateInput(values),
});
