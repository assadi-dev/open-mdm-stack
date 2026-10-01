import type { z } from "zod";
import type { buildWifiNetworkFormSchema, wifiNetworkSchema } from "../_dto/wifi-network.dto";

export type WifiNetwork = z.infer<typeof wifiNetworkSchema>;
export type WifiSecurity = WifiNetwork["security"];
export type WifiNetworkFormValues = z.infer<ReturnType<typeof buildWifiNetworkFormSchema>>;

// Ce que l'API reçoit : le mot de passe est écrit seulement, elle ne le renvoie jamais.
export type CreateWifiNetworkInput = {
  ssid: string;
  security: WifiSecurity;
  password?: string;
};

export type UpdateWifiNetworkInput = CreateWifiNetworkInput & {
  id: string;
};

export type WifiSecurityOption = {
  value: WifiSecurity;
  label: string;
};
